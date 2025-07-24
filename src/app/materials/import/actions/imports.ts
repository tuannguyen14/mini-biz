'use server';

import { supabase } from "@/lib/supabase";
import { ImportHistory, ImportItem, Statistics, PeriodType } from "@/types";
import * as XLSX from 'xlsx';

interface ExcelImportRow {
    name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    notes?: string;
    current_stock?: number;
}

export async function getImportHistory(period: PeriodType = 'all'): Promise<{
    imports: ImportHistory[];
    statistics: Statistics;
}> {
    try {
        let query = supabase
            .from('material_imports')
            .select(`
        *,
        material:materials(name, unit)
      `)
            .order('import_date', { ascending: false })
            .limit(50);

        // Filter by period
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.gte('import_date', today.toISOString());
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('import_date', weekAgo.toISOString());
        } else if (period === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte('import_date', monthAgo.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        // Calculate statistics
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayImports = data?.filter(imp =>
            new Date(imp.import_date) >= todayStart
        ) || [];

        const statistics: Statistics = {
            totalImports: data?.length || 0,
            totalValue: data?.reduce((sum, imp) => sum + (imp.total_amount || 0), 0) || 0,
            uniqueMaterials: new Set(data?.map(imp => imp.material_id)).size || 0,
            todayImports: todayImports.length
        };

        return {
            imports: data || [],
            statistics
        };
    } catch (error) {
        console.error('Error fetching import history:', error);
        return {
            imports: [],
            statistics: { totalImports: 0, totalValue: 0, uniqueMaterials: 0, todayImports: 0 }
        };
    }
}

export async function saveImport(importItems: ImportItem[], notes: string = '') {
    try {
        console.error(importItems);
        const importData = importItems.map(item => ({
            material_id: item.materialId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            notes: notes || null,
            import_date: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('material_imports')
            .insert(importData);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error saving import:', error);
        return { success: false, error: 'Không thể lưu phiếu nhập' };
    }
}

export async function importFromExcel(file: File): Promise<{ success: boolean; message?: string }> {
    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data: ExcelImportRow[] = XLSX.utils.sheet_to_json(worksheet);

        if (!data.length) {
            return { success: false, message: "Tệp Excel không có dữ liệu" };
        }

        // Validate required fields and normalize data
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Normalize and validate name
            if (!row.name || typeof row.name !== 'string' || !row.name.toString().trim()) {
                return {
                    success: false,
                    message: `Dòng ${i + 2}: Thiếu tên vật tư hoặc tên vật tư không hợp lệ`
                };
            }
            row.name = row.name.toString().trim();
            
            // Normalize and validate unit
            if (!row.unit || typeof row.unit !== 'string' || !row.unit.toString().trim()) {
                return {
                    success: false,
                    message: `Dòng ${i + 2}: Thiếu đơn vị tính hoặc đơn vị tính không hợp lệ`
                };
            }
            row.unit = row.unit.toString().trim();
            
            // Normalize and validate unit_price
            if (row.unit_price === null || row.unit_price === undefined || isNaN(Number(row.unit_price)) || Number(row.unit_price) <= 0) {
                return {
                    success: false,
                    message: `Dòng ${i + 2}: Đơn giá phải là số dương`
                };
            }
            row.unit_price = Number(row.unit_price);
            
            // Normalize quantity
            if (row.quantity === null || row.quantity === undefined || isNaN(Number(row.quantity))) {
                row.quantity = 0;
            } else {
                row.quantity = Number(row.quantity);
            }
            
            // Normalize notes
            if (row.notes) {
                row.notes = row.notes.toString().trim();
            }
        }

        // Kiểm tra trùng lặp tên trong Excel
        const namesInExcel = data.map(row => row.name.toLowerCase()); // Đã được trim ở trên
        const duplicatesInExcel = namesInExcel.filter((name, index) => 
            namesInExcel.indexOf(name) !== index
        );
        
        if (duplicatesInExcel.length > 0) {
            const uniqueDuplicates = [...new Set(duplicatesInExcel)];
            return {
                success: false,
                message: `Tệp Excel có vật tư trùng lặp: ${uniqueDuplicates.join(', ')}`
            };
        }

        // Lấy danh sách vật tư hiện có
        const { data: existingMaterials, error: fetchError } = await supabase
            .from('materials')
            .select('id, name');

        if (fetchError) throw fetchError;

        const materialNameToId = new Map<string, string>();
        const newMaterials: { name: string; unit: string }[] = [];
        const importRecords: any[] = [];
        const duplicateNames: string[] = [];

        for (const row of data) {
            const trimmedName = row.name; // Đã được trim ở trên
            
            // Kiểm tra vật tư đã tồn tại trong database
            const existingMaterial = existingMaterials?.find(
                m => m.name.toLowerCase().trim() === trimmedName.toLowerCase()
            );

            if (existingMaterial) {
                // Vật tư đã tồn tại - thêm vào danh sách trùng lặp
                duplicateNames.push(trimmedName);
                materialNameToId.set(row.name, existingMaterial.id);
            } else {
                // Vật tư mới - kiểm tra xem đã được đánh dấu để tạo chưa
                if (!materialNameToId.has(row.name)) {
                    newMaterials.push({
                        name: trimmedName,
                        unit: row.unit // Đã được trim ở trên
                    });
                }
            }

            importRecords.push({
                name: row.name,
                quantity: row.quantity,
                unit_price: row.unit_price,
                notes: row.notes || null,
                import_date: new Date().toISOString()
            });
        }

        // Nếu có vật tư trùng lặp, báo lỗi chi tiết
        if (duplicateNames.length > 0) {
            const uniqueDuplicates = [...new Set(duplicateNames)];
            return {
                success: false,
                message: `Các vật tư sau đã tồn tại trong hệ thống: ${uniqueDuplicates.join(', ')}. Vui lòng kiểm tra lại hoặc xóa chúng khỏi file Excel.`
            };
        }

        // Tạo vật tư mới
        if (newMaterials.length > 0) {
            const { data: insertedMaterials, error: insertError } = await supabase
                .from('materials')
                .insert(newMaterials)
                .select('id, name');

            if (insertError) {
                // Kiểm tra lỗi unique constraint
                if (insertError.code === '23505') {
                    return {
                        success: false,
                        message: 'Có vật tư trong file Excel bị trùng tên với vật tư đã tồn tại. Vui lòng kiểm tra lại.'
                    };
                }
                throw insertError;
            }

            insertedMaterials?.forEach(m => {
                const originalRow = data.find(row => 
                    row.name.toLowerCase() === m.name.toLowerCase() // Đã được normalize ở trên
                );
                if (originalRow) {
                    materialNameToId.set(originalRow.name, m.id);
                }
            });
        }

        // Chuẩn bị dữ liệu nhập kho
        const finalImportRecords = importRecords.map(record => ({
            material_id: materialNameToId.get(record.name),
            quantity: record.quantity,
            unit_price: record.unit_price,
            notes: record.notes,
            import_date: record.import_date
        }));

        // Lưu phiếu nhập
        const { error: importError } = await supabase
            .from('material_imports')
            .insert(finalImportRecords);

        if (importError) throw importError;

        return {
            success: true,
            message: `Nhập thành công ${data.length} vật tư (${newMaterials.length} vật tư mới)`
        };
    } catch (error) {
        console.error('Error importing from Excel:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Lỗi khi nhập dữ liệu từ Excel"
        };
    }
}
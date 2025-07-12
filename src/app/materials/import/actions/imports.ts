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

        for (const row of data) {
            if (!row.name || !row.unit || !row.quantity || !row.unit_price) {
                return {
                    success: false,
                    message: "Thiếu thông tin bắt buộc (name, unit, quantity, unit_price)"
                };
            }
        }

        const { data: existingMaterials, error: fetchError } = await supabase
            .from('materials')
            .select('id, name');

        if (fetchError) throw fetchError;

        const materialNameToId = new Map<string, string>();
        const newMaterials: { name: string; unit: string }[] = [];
        const importRecords: any[] = [];

        for (const row of data) {
            const existingMaterial = existingMaterials?.find(m => m.name === row.name);

            if (existingMaterial) {
                materialNameToId.set(row.name, existingMaterial.id);
            } else {
                if (!materialNameToId.has(row.name)) {
                    newMaterials.push({
                        name: row.name,
                        unit: row.unit
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

        // 🔧 Không cập nhật current_stock bằng code nữa!

        // Insert new materials
        if (newMaterials.length > 0) {
            const { data: insertedMaterials, error: insertError } = await supabase
                .from('materials')
                .insert(newMaterials)
                .select('id, name');

            if (insertError) throw insertError;

            insertedMaterials?.forEach(m => {
                materialNameToId.set(m.name, m.id);
            });
        }

        // Prepare import records with material_ids
        const finalImportRecords = importRecords.map(record => ({
            material_id: materialNameToId.get(record.name),
            quantity: record.quantity,
            unit_price: record.unit_price,
            notes: record.notes,
            import_date: record.import_date
        }));

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

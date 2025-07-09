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

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data: ExcelImportRow[] = XLSX.utils.sheet_to_json(worksheet);

        // Validate data structure
        if (!data.length) {
            return { success: false, message: "Tệp Excel không có dữ liệu" };
        }



        // Check required fields
        for (const row of data) {
            if (!row.name || !row.unit || !row.quantity || !row.unit_price) {
                return {
                    success: false,
                    message: "Thiếu thông tin bắt buộc (name, unit, quantity, unit_price)"
                };
            }
        }

        // Group materials by name to avoid duplicates
        const materialMap = new Map<string, ExcelImportRow>();
        data.forEach(row => {
            if (!materialMap.has(row.name)) {
                materialMap.set(row.name, row);
            }
        });

        // Insert materials first
        const materialsToInsert = Array.from(materialMap.values()).map(material => ({
            name: material.name,
            unit: material.unit,
            current_stock: material.current_stock || 0
        }));

        const { data: insertedMaterials, error: materialsError } = await supabase
            .from('materials')
            .insert(materialsToInsert)
            .select('id, name');

        if (materialsError) throw materialsError;

        // Create a mapping of material names to IDs for the imports
        const materialNameToId = new Map(
            insertedMaterials.map(m => [m.name, m.id])
        );

        // Prepare import data with material IDs
        const importRecords = data.map(row => {
            const materialId = materialNameToId.get(row.name);
            if (!materialId) {
                throw new Error(`Không tìm thấy vật tư: ${row.name}`);
            }

            return {
                material_id: materialId,
                quantity: row.quantity,
                unit_price: row.unit_price,
                notes: row.notes || null,
                import_date: new Date().toISOString()
            };
        });

        // Insert import records
        const { error: importsError } = await supabase
            .from('material_imports')
            .insert(importRecords);

        if (importsError) throw importsError;

        return {
            success: true,
            message: `Nhập thành công ${data.length} vật tư từ Excel`
        };
    } catch (error) {
        console.error('Error importing from Excel:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "Lỗi khi nhập dữ liệu từ Excel"
        };
    }
}
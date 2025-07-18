'use server';

import { supabase } from "@/lib/supabase";
import { Material } from "@/types";

export async function getMaterials(): Promise<Material[]> {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
}

export async function createMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('materials')
      .insert([material])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating material:', error);
    return { success: false, error: 'Không thể tạo vật tư mới' };
  }
}

export async function deleteMaterial(materialId: string) {
  try {
    // Xóa tất cả các phiếu nhập liên quan trước
    const { error: deleteImportsError } = await supabase
      .from('material_imports')
      .delete()
      .eq('material_id', materialId);

    if (deleteImportsError) throw deleteImportsError;

    // Sau đó xóa vật tư
    const { error: deleteMaterialError } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (deleteMaterialError) throw deleteMaterialError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting material and imports:', error);
    return { success: false, error: 'Không thể xóa vật tư và các phiếu nhập' };
  }
}


export async function updateMaterial(
  materialId: string,
  updates: { name?: string; current_stock?: number }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Tạo object updates với updated_at
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Xóa các field undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (Object.keys(updateData).length === 1) { // Chỉ có updated_at
      return { success: false, error: 'Không có thông tin nào để cập nhật' };
    }

    const { data, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', materialId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: 'Không thể cập nhật vật tư' };
    }

    if (!data) {
      return { success: false, error: 'Không tìm thấy vật tư' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating material:', error);
    return { success: false, error: 'Không thể cập nhật vật tư' };
  }
}

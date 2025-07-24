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
    // Kiểm tra tên vật tư đã tồn tại chưa
    const { data: existingMaterial, error: checkError } = await supabase
      .from('materials')
      .select('id, name')
      .ilike('name', material.name.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 là mã lỗi "không tìm thấy", các lỗi khác cần throw
      throw checkError;
    }

    if (existingMaterial) {
      return { 
        success: false, 
        error: `Vật tư "${material.name}" đã tồn tại trong hệ thống` 
      };
    }

    // Tạo vật tư mới
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        ...material,
        name: material.name.trim() // Loại bỏ khoảng trắng thừa
      }])
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
    // Kiểm tra xem vật tư có phiếu nhập nào không
    const { data: imports, error: checkError } = await supabase
      .from('material_imports')
      .select('id')
      .eq('material_id', materialId)
      .limit(1);

    if (checkError) throw checkError;

    if (imports && imports.length > 0) {
      return { 
        success: false, 
        error: 'Không thể xóa vật tư đã có phiếu nhập trong hệ thống' 
      };
    }

    // Xóa vật tư
    const { error: deleteMaterialError } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (deleteMaterialError) throw deleteMaterialError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting material:', error);
    return { success: false, error: 'Không thể xóa vật tư' };
  }
}

export async function updateMaterial(
  materialId: string,
  updates: { name?: string; current_stock?: number }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Nếu cập nhật tên, kiểm tra trùng lặp
    if (updates.name) {
      const trimmedName = updates.name.trim();
      
      if (!trimmedName) {
        return { success: false, error: 'Tên vật tư không được để trống' };
      }

      // Kiểm tra tên đã tồn tại chưa (loại trừ chính vật tư đang cập nhật)
      const { data: existingMaterial, error: checkError } = await supabase
        .from('materials')
        .select('id, name')
        .ilike('name', trimmedName)
        .neq('id', materialId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMaterial) {
        return { 
          success: false, 
          error: `Tên vật tư "${trimmedName}" đã được sử dụng bởi vật tư khác` 
        };
      }

      updates.name = trimmedName;
    }

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
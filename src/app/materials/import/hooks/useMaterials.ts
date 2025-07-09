'use client';

import { useState, useCallback } from 'react';
import { Material } from '@/types';
import { getMaterials, createMaterial, deleteMaterial, updateMaterial } from '../actions/materials';
import { toast } from 'sonner';

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (error) {
      toast.error('Không thể tải danh sách vật tư');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMaterial = useCallback(async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await createMaterial(material);
    if (result.success) {
      setMaterials(prev => [...prev, result.data]);
      toast.success('Đã thêm vật tư mới');
      return result.data;
    } else {
      toast.error(result.error);
      return null;
    }
  }, []);

  const updateMaterialData = useCallback(async (
    materialId: string, 
    updates: { name?: string; current_stock?: number }
  ) => {
    const result = await updateMaterial(materialId, updates);
    if (result.success) {
      setMaterials(prev => prev.map(material => 
        material.id === materialId 
          ? { ...material, ...updates, updated_at: new Date().toISOString() }
          : material
      ));
      toast.success('Đã cập nhật vật tư thành công');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  }, []);

  const removeMaterial = useCallback(async (materialId: string) => {
    const result = await deleteMaterial(materialId);
    if (result.success) {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
      toast.success('Đã xóa vật tư thành công');
      return true;
    } else {
      toast.error(result.error);
      return false;
    }
  }, []);

  return {
    materials,
    loading,
    fetchMaterials,
    addMaterial,
    updateMaterial: updateMaterialData,
    removeMaterial
  };
}
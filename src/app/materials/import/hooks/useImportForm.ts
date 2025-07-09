'use client';

import { useState, useCallback } from 'react';
import { ImportItem, Material } from '@/types';
import { saveImport } from '../actions/imports';
import { toast } from 'sonner';

export function useImportForm() {
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importNotes, setImportNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addImportItem = useCallback((material: Material) => {
    const existingItem = importItems.find(item => item.materialId === material.id);
    if (existingItem) {
      toast.error('Vật tư này đã có trong danh sách nhập');
      return false;
    }

    const newItem: ImportItem = {
      materialId: material.id,
      materialName: material.name,
      unit: material.unit,
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    };

    setImportItems(prev => [...prev, newItem]);
    return true;
  }, [importItems]);

  const updateImportItem = useCallback((index: number, field: keyof ImportItem, value: any) => {
    setImportItems(prev => {
      const newItems = [...prev];
      (newItems[index] as any)[field] = value;

      // Calculate total amount
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalAmount = newItems[index].quantity * newItems[index].unitPrice;
      }

      return newItems;
    });
  }, []);

  const removeImportItem = useCallback((index: number) => {
    setImportItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const calculateTotals = useCallback(() => {
    return importItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }, [importItems]);

  const submitImport = useCallback(async () => {
    if (importItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất một vật tư để nhập');
      return false;
    }

    const invalidItems = importItems.filter(item =>
      !item.quantity || item.quantity <= 0 ||
      !item.unitPrice || item.unitPrice <= 0
    );

    if (invalidItems.length > 0) {
      toast.error('Vui lòng nhập đầy đủ số lượng và đơn giá cho tất cả vật tư');
      return false;
    }

    setSaving(true);
    try {
      const result = await saveImport(importItems, importNotes);
      if (result.success) {
        toast.success('Thành công');
        setImportItems([]);
        setImportNotes('');
        return true;
      } else {
        toast.error(result.error);
        return false;
      }
    } finally {
      setSaving(false);
    }
  }, [importItems, importNotes]);

  const resetForm = useCallback(() => {
    setImportItems([]);
    setImportNotes('');
  }, []);

  return {
    importItems,
    importNotes,
    saving,
    setImportNotes,
    addImportItem,
    updateImportItem,
    removeImportItem,
    calculateTotals,
    submitImport,
    resetForm
  };
}
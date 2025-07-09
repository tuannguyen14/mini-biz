import { ImportItem } from '@/types';

export function validateImportItem(item: ImportItem): string[] {
  const errors: string[] = [];

  if (!item.quantity || item.quantity <= 0) {
    errors.push('Số lượng phải lớn hơn 0');
  }

  if (!item.unitPrice || item.unitPrice <= 0) {
    errors.push('Đơn giá phải lớn hơn 0');
  }

  if (item.quantity > 999999) {
    errors.push('Số lượng không được vượt quá 999,999');
  }

  if (item.unitPrice > 999999999) {
    errors.push('Đơn giá không được vượt quá 999,999,999 VND');
  }

  return errors;
}

export function validateMaterial(name: string, unit: string): string[] {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Tên vật tư không được để trống');
  }

  if (name && name.length > 100) {
    errors.push('Tên vật tư không được vượt quá 100 ký tự');
  }

  if (!unit || unit.trim().length === 0) {
    errors.push('Đơn vị tính không được để trống');
  }

  if (unit && unit.length > 20) {
    errors.push('Đơn vị tính không được vượt quá 20 ký tự');
  }

  return errors;
}
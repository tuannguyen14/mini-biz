export interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  updated_at: string;
  created_at: string;
}

export interface ImportItem {
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface ImportHistory {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes: string | null;
  import_date: string;
  material: {
    name: string;
    unit: string;
  };
}

export interface ImportStats {
  totalImports: number;
  totalValue: number;
  uniqueMaterials: number;
  todayImports: number;
}
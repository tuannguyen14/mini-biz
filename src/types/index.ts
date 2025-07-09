export interface Material {
  id: string;
  name: string;
  unit: string;
  current_stock?: number;
  created_at: string;
  updated_at: string;
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
  notes?: string;
  import_date: string;
  material: {
    name: string;
    unit: string;
  };
}

export interface Statistics {
  totalImports: number;
  totalValue: number;
  uniqueMaterials: number;
  todayImports: number;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
}

export interface ProductMaterial {
  id: string;
  material_id: string;
  quantity_required: number;
  material: Material;
}

export interface ProductFormData {
  name: string;
  unit: string;
  quantity: number;
  materials: { material_id: string; quantity_required: number }[];
  notes: string;
}

export interface RecentActivity {
  id: string;
  type: 'product_creation';
  product_name: string;
  quantity?: number;
  created_at: string;
  notes?: string;
}

export interface ProductPossibleQuantity {
  product_id: string;
  product_name: string;
  product_unit: string;
  max_possible_quantity: number;
}

export interface Stats {
  totalProducts: number;
  totalMaterials: number;
  totalMaterialStock: number;
  totalOrdersToday: number;
}


export type TabType = 'import' | 'history' | 'inventory';
export type PeriodType = 'all' | 'today' | 'week' | 'month';
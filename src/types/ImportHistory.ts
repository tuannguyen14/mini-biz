export interface ImportHistory {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  import_date: string;
  notes: string | null;
  material: {
    name: string;
    unit: string;
  };
}

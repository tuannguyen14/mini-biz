export interface ExcelImportResult {
  success: boolean;
  data?: any[];
  errors?: string[];
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
}

export interface MaterialImportRow {
  name: string;
  unit: string;
  current_stock?: number;
  rowIndex: number;
  errors?: string[];
}

export interface MaterialImportEntryRow {
  material_name: string;
  quantity: number;
  unit_price: number;
  import_date?: string;
  notes?: string;
  rowIndex: number;
  errors?: string[];
}

export interface ImportPreview {
  valid: (MaterialImportRow | MaterialImportEntryRow)[];
  invalid: (MaterialImportRow | MaterialImportEntryRow)[];
  duplicates: (MaterialImportRow | MaterialImportEntryRow)[];
  totalRows: number;
}

export interface ExcelColumn {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date';
}

export type ImportType = 'materials' | 'imports';

export interface ImportTemplate {
  type: ImportType;
  name: string;
  description: string;
  columns: ExcelColumn[];
  filename: string;
}
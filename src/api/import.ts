import { invoke } from "@tauri-apps/api/core";

export interface CsvImportReport {
  total_rows: number;
  books_created: number;
  books_found: number;
  tags_created: number;
  tag_associations: number;
  errors: string[];
}

/** 批量导入 CSV 格式的图书标签 */
export async function importBooksCsv(csvText: string): Promise<CsvImportReport> {
  return invoke("import_books_csv", { csvText });
}

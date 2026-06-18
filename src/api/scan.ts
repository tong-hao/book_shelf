import { invoke } from "@tauri-apps/api/core";
import type { BookWithTags } from "./types";

export interface ScanReport {
  total: number;
  added: number;
  updated: number;
  errors: string[];
}

export interface ScanProgress {
  current: number;
  total: number;
  current_file: string;
}

export interface SearchFilter {
  keyword?: string;
  tag_ids?: number[];
  is_read?: number;
  min_rating?: number;
  sort_by?: string;
  sort_order?: string;
}

/** 扫描目录 */
export async function scanDirectory(root: string): Promise<ScanReport> {
  return invoke("scan_directory", { root });
}

/** 搜索图书 */
export async function searchBooks(filter: SearchFilter): Promise<BookWithTags[]> {
  return invoke("search_books", { filter });
}

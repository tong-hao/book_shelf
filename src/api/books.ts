import { invoke } from "@tauri-apps/api/core";
import type { BookWithTags } from "./types";

/** 获取所有图书 */
export async function getBooks(): Promise<BookWithTags[]> {
  return invoke("get_books");
}

/** 获取单本图书 */
export async function getBook(bookId: number): Promise<BookWithTags | null> {
  return invoke("get_book", { bookId });
}

/** 更新图书字段 */
export async function updateBookField(
  bookId: number,
  field: string,
  value: unknown
): Promise<void> {
  return invoke("update_book_field", { bookId, field, value });
}

/** 更换图书封面 */
export async function updateBookCover(
  bookId: number,
  imagePath: string
): Promise<string> {
  return invoke("update_book_cover", { bookId, imagePath });
}

/** 删除图书记录 */
export async function deleteBook(bookId: number): Promise<void> {
  return invoke("delete_book", { bookId });
}

/** 批量删除图书记录 */
export async function deleteBooks(bookIds: number[]): Promise<number> {
  return invoke("delete_books", { bookIds });
}

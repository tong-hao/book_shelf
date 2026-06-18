import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "./types";

export interface TagWithCount {
  id: number;
  name: string;
  color: string | null;
  count: number;
}

/** 获取所有标签 */
export async function listTags(): Promise<Tag[]> {
  return invoke("list_tags");
}

/** 获取标签及其图书数量 */
export async function listTagsWithCount(): Promise<TagWithCount[]> {
  return invoke("list_tags_with_count");
}

/** 创建标签 */
export async function createTag(name: string, color?: string): Promise<Tag> {
  return invoke("create_tag", { name, color: color || null });
}

/** 更新标签颜色 */
export async function updateTagColor(tagId: number, color: string | null): Promise<void> {
  return invoke("update_tag_color", { tagId, color });
}

/** 删除标签 */
export async function deleteTag(tagId: number): Promise<void> {
  return invoke("delete_tag", { tagId });
}

/** 批量给图书打标签 */
export async function addTagsToBooks(
  bookIds: number[],
  tagIds: number[]
): Promise<number> {
  return invoke("add_tags_to_books", { bookIds, tagIds });
}

/** 移除图书的标签 */
export async function removeTagFromBook(
  bookId: number,
  tagId: number
): Promise<void> {
  return invoke("remove_tag_from_book", { bookId, tagId });
}

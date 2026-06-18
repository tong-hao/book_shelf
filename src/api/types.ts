export interface Book {
  id: number;
  file_path: string;
  file_hash: string | null;
  format: string | null;
  title: string;
  author: string | null;
  cover_path: string | null;
  file_size: number | null;
  added_at: string;
  rating: number;
  is_read: number;
  liked: number | null;
  note_link: string | null;
  remark: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface BookWithTags {
  id: number;
  file_path: string;
  file_hash: string | null;
  format: string | null;
  title: string;
  author: string | null;
  cover_path: string | null;
  file_size: number | null;
  added_at: string;
  rating: number;
  is_read: number;
  liked: number | null;
  note_link: string | null;
  remark: string | null;
  tags: Tag[];
}

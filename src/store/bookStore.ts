import { create } from "zustand";
import type { BookWithTags } from "../api/types";
import * as booksApi from "../api/books";
import * as scanApi from "../api/scan";
import { useUiStore } from "./uiStore";

interface BookState {
  books: BookWithTags[];
  selectedBookIds: number[];
  selectedBook: BookWithTags | null;
  isLoading: boolean;
  searchKeyword: string;
  filteredTagIds: number[];

  loadBooks: () => Promise<void>;
  selectBook: (book: BookWithTags | null) => void;
  handleBookClick: (book: BookWithTags) => void;
  toggleBookSelection: (bookId: number) => void;
  selectAllBooks: () => void;
  clearSelection: () => void;
  setSearchKeyword: (keyword: string) => void;
  setFilteredTagIds: (tagIds: number[]) => void;
  updateBookField: (bookId: number, field: string, value: unknown) => Promise<void>;
  deleteSelectedBooks: () => Promise<void>;
  scanDirectory: (root: string) => Promise<scanApi.ScanReport>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  selectedBookIds: [],
  selectedBook: null,
  isLoading: false,
  searchKeyword: "",
  filteredTagIds: [],

  loadBooks: async () => {
    const { selectedBook } = get();
    set({ isLoading: true });
    try {
      const { searchKeyword, filteredTagIds } = get();
      const books = searchKeyword || filteredTagIds.length > 0
        ? await scanApi.searchBooks({ keyword: searchKeyword, tag_ids: filteredTagIds })
        : await booksApi.getBooks();

      const updatedSelected = selectedBook
        ? books.find((b) => b.id === selectedBook.id) || null
        : null;

      set({ books, selectedBook: updatedSelected, isLoading: false });
    } catch (e) {
      console.error("Failed to load books:", e);
      set({ isLoading: false });
    }
  },

  selectBook: (book) => set({ selectedBook: book }),

  // 统一的点击处理：单选模式 vs 多选模式
  handleBookClick: (book) => {
    const { multiSelect } = useUiStore.getState();
    if (multiSelect) {
      // 多选 → 切换选中状态
      const { selectedBookIds } = get();
      const newIds = selectedBookIds.includes(book.id)
        ? selectedBookIds.filter((id) => id !== book.id)
        : [...selectedBookIds, book.id];
      set({ selectedBookIds: newIds, selectedBook: book });
    } else {
      // 单选 → 只选中当前图书，清除其他
      set({ selectedBookIds: [book.id], selectedBook: book });
    }
  },

  toggleBookSelection: (bookId) => {
    const { selectedBookIds } = get();
    if (selectedBookIds.includes(bookId)) {
      set({ selectedBookIds: selectedBookIds.filter((id) => id !== bookId) });
    } else {
      set({ selectedBookIds: [...selectedBookIds, bookId] });
    }
  },

  selectAllBooks: () => {
    const { books } = get();
    set({ selectedBookIds: books.map((b) => b.id) });
  },

  clearSelection: () => set({ selectedBookIds: [], selectedBook: null }),

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
    get().loadBooks();
  },

  setFilteredTagIds: (tagIds) => {
    set({ filteredTagIds: tagIds });
    get().loadBooks();
  },

  updateBookField: async (bookId, field, value) => {
    await booksApi.updateBookField(bookId, field, value);
    get().loadBooks();
  },

  deleteSelectedBooks: async () => {
    const { selectedBookIds } = get();
    if (selectedBookIds.length === 0) return;
    await booksApi.deleteBooks(selectedBookIds);
    set({ selectedBookIds: [], selectedBook: null });
    get().loadBooks();
  },

  scanDirectory: async (root) => {
    const report = await scanApi.scanDirectory(root);
    get().loadBooks();
    return report;
  },
}));

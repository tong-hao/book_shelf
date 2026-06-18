import { useEffect } from "react";
import { useBookStore } from "../store/bookStore";

export function useBooks() {
  const {
    books,
    isLoading,
    selectedBookIds,
    selectedBook,
    loadBooks,
    selectBook,
    toggleBookSelection,
    selectAllBooks,
    clearSelection,
    updateBookField,
    deleteSelectedBooks,
    scanDirectory,
  } = useBookStore();

  useEffect(() => {
    loadBooks();
  }, []);

  return {
    books,
    isLoading,
    selectedBookIds,
    selectedBook,
    loadBooks,
    selectBook,
    toggleBookSelection,
    selectAllBooks,
    clearSelection,
    updateBookField,
    deleteSelectedBooks,
    scanDirectory,
  };
}

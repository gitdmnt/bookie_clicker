import { useState, useCallback } from "react";

export default function useAddBookModal(initial = false) {
  const [isAddBookModalVisible, setVisible] = useState<boolean>(initial);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  return { isAddBookModalVisible, open, close };
}

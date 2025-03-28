import { useState } from "react";

interface Modal {
  onOpen: () => void;
  onClose: () => void;
  children: any;
}

const useModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  const Modal = (m: Modal) => {
    const onOpen = () => {
      setIsVisible(true);
      m.onOpen();
    };

    const onClose = () => {
      m.onClose();
      setIsVisible(false);
    };

    const Children = m.children;
    isVisible && (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Children />
        </div>
      </div>
    );
  };

  return { Modal, isVisible, onOpen, onClose };
};

export default useModal;


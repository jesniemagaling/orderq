import React, { useEffect, useRef, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string; // optional prop to adjust width
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-3xl',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(isOpen);

  // Handle opening/closing animations
  useEffect(() => {
    if (isOpen) setShow(true);
    else {
      // delay hiding to allow closing animation
      const timeout = setTimeout(() => setShow(false), 300); // match animation duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Close modal if window width < 1024
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && isOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    else document.removeEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        ref={modalRef}
        className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} p-6 transform transition-transform duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute text-gray-500 right-4 top-4 hover:text-black"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

import { useState } from "react";

interface ConfirmOptions {
  title: string;
  description: string;
}

export const useConfirm = (title: string, description: string) => {
  const [isOpen, setIsOpen] = useState(false);

  const confirm = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsOpen(true);
      
      const result = window.confirm(`${title}\n\n${description}`);
      setIsOpen(false);
      resolve(result);
    });
  };

  const ConfirmDialog = () => {
    if (!isOpen) return null;
    return null; 
  };

  return [ConfirmDialog, confirm] as const;
};

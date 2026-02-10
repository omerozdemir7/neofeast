import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center p-4 rounded-xl shadow-lg border animate-slide-down min-w-[300px]
      ${type === 'success' ? 'bg-white border-green-500 text-gray-800' : 'bg-white border-red-500 text-gray-800'}`}>
      
      {type === 'success' ? (
        <CheckCircle className="text-green-500 mr-3" size={24} />
      ) : (
        <AlertCircle className="text-red-500 mr-3" size={24} />
      )}
      
      <p className="flex-1 font-medium text-sm">{message}</p>
      
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-3">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;

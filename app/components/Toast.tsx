import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`rounded-lg px-4 py-3 shadow-lg ${
          type === 'error' 
            ? 'bg-red-100 border-2 border-red-200 text-red-700' 
            : 'bg-green-100 border-2 border-green-200 text-green-700'
        }`}
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl">
            {type === 'error' ? '❌' : '✅'}
          </span>
          <p className="font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
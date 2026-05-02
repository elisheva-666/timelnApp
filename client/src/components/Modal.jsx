import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Centering wrapper — min-h-full lets dialog grow past viewport with scroll */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white border border-dark-700 rounded-2xl shadow-xl w-full ${sizes[size]} my-4`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>

          {title && (
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="font-bold text-dark-50 text-lg" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
              <button onClick={onClose}
                className="p-1.5 rounded-lg transition-colors text-dark-500 hover:text-dark-100 hover:bg-dark-900">
                <X size={17} />
              </button>
            </div>
          )}

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

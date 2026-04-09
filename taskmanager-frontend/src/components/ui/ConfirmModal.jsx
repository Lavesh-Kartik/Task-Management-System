import { AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-800'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h2>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">{message}</p>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center min-w-[80px] ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'
            } disabled:opacity-50`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

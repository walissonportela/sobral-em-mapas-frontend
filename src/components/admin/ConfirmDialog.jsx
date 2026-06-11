import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {title}
              </h2>

              <p className="text-sm text-slate-500">
                Esta ação precisa de confirmação.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-50 flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 leading-relaxed">
            {message}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
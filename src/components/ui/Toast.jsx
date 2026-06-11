import { useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  X,
} from "lucide-react";

export default function Toast({
  type = "success",
  message,
  onClose,
  duration = 3500,
}) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={24} />,
      title: "Sucesso",
      border: "border-green-500",
      iconBox: "bg-green-100 text-green-700",
      titleColor: "text-green-700",
    },
    error: {
      icon: <XCircle size={24} />,
      title: "Erro",
      border: "border-red-500",
      iconBox: "bg-red-100 text-red-700",
      titleColor: "text-red-700",
    },
    info: {
      icon: <Info size={24} />,
      title: "Aviso",
      border: "border-blue-500",
      iconBox: "bg-blue-100 text-blue-700",
      titleColor: "text-blue-700",
    },
  };

  const current = config[type] || config.info;

  return (
    <>
      <style>
        {`
          @keyframes toastIn {
            from {
              opacity: 0;
              transform: translateY(-12px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div
        className="
          fixed
          top-6
          right-6
          z-[10000]
          w-full
          max-w-md
        "
        style={{
          animation: "toastIn 0.25s ease-out",
        }}
      >
        <div
          className={`
            bg-white
            border
            ${current.border}
            border-l-8
            rounded-3xl
            shadow-2xl
            p-5
            flex
            items-start
            gap-4
          `}
        >
          <div
            className={`
              h-12
              w-12
              rounded-2xl
              flex
              items-center
              justify-center
              shrink-0
              ${current.iconBox}
            `}
          >
            {current.icon}
          </div>

          <div className="flex-1">
            <p
              className={`
                font-black
                ${current.titleColor}
              `}
            >
              {current.title}
            </p>

            <p className="text-sm mt-1 leading-relaxed text-slate-700">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              h-8
              w-8
              rounded-xl
              text-slate-400
              hover:bg-slate-100
              hover:text-slate-700
              flex
              items-center
              justify-center
              transition
            "
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
import React from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
} from "lucide-react";

import LoadingSpinner from "../ui/LoadingSpinner";

export default function LoginForm({
  email,
  password,
  showPassword,
  loading,
  error,
  successMessage,
  setEmail,
  setPassword,
  setShowPassword,
  handleLogin,
}) {
  return (
    <form
      onSubmit={handleLogin}
      className="space-y-5"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <LogIn
              size={28}
              className="text-blue-700"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Faça seu Login
            </h2>

            <p className="text-gray-500">
              Acesse sua conta para continuar.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            Entre com suas credenciais para acessar recursos
            exclusivos do
            <strong> Sobral em Mapas</strong>.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2
            size={20}
            className="shrink-0 mt-0.5"
          />

          <p className="text-sm leading-relaxed">
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">
          E-mail
        </label>

        <div className="relative">
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={loading}
            required
            autoComplete="email"
            className="
              w-full
              pl-11
              pr-4
              py-3
              border
              border-gray-200
              rounded-xl
              outline-none
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
              disabled:bg-gray-100
              transition
            "
            placeholder="Digite seu e-mail"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Senha
          </label>

          <button
            type="button"
            className="text-xs text-blue-700 hover:text-blue-900 font-medium"
          >
            Esqueceu a senha?
          </button>
        </div>

        <div className="relative">
          <Lock
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            disabled={loading}
            required
            autoComplete="current-password"
            className="
              w-full
              pl-11
              pr-12
              py-3
              border
              border-gray-200
              rounded-xl
              outline-none
              focus:border-blue-500
              focus:ring-4
              focus:ring-blue-100
              disabled:bg-gray-100
              transition
            "
            placeholder="Digite sua senha"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            aria-label={
              showPassword
                ? "Ocultar senha"
                : "Mostrar senha"
            }
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          h-14
          bg-gradient-to-r
          from-blue-700
          to-blue-800
          hover:from-blue-800
          hover:to-blue-900
          disabled:opacity-70
          disabled:cursor-not-allowed
          text-white
          rounded-xl
          font-semibold
          flex
          justify-center
          items-center
          gap-2
          transition-all
          shadow-lg
        "
      >
        {loading ? (
          <>
            <LoadingSpinner />
            Autenticando...
          </>
        ) : (
          <>
            <LogIn size={18} />
            Entrar no Sistema
          </>
        )}
      </button>
    </form>
  );
}
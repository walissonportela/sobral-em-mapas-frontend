import React, { useState } from "react";
import api from "../services/api";

import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  Building2,
} from "lucide-react";

const LoginModal = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post(
        "/login",
        {
          email,
          password,
        }
      );

      if (response.data.success) {
        localStorage.setItem(
          "admin_token",
          response.data.token
        );

        onLoginSuccess(
          response.data.user
        );

        onClose();
      }
    } catch (error) {
      setError(
        "Falha no login. Verifique suas credenciais."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="
        fixed
        inset-0
        z-[9999]
        bg-black/60
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
      "
    >
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
        className="
          relative
          w-full
          max-w-5xl
          min-h-[620px]
          bg-white
          rounded-3xl
          overflow-hidden
          shadow-2xl
          grid
          grid-cols-2
        "
      >
        {/* FECHAR */}
        <button
          onClick={onClose}
          className="
            absolute
            top-5
            right-5
            h-10
            w-10
            rounded-full
            flex
            items-center
            justify-center
            text-gray-500
            hover:bg-gray-100
            hover:text-red-600
            transition
            z-20
          "
        >
          <X size={20} />
        </button>

        {/* PAINEL ESQUERDO */}
        <div
          className="
            bg-gradient-to-br
            from-blue-700
            via-blue-800
            to-blue-900
            text-white
            p-10
            flex
            flex-col
            justify-between
          "
        >
          <div>
            {/* LOGO */}
            <div className="flex items-center gap-4 mb-8">
                <img
                    src="/Logo_Sobral.png"
                    alt="Prefeitura de Sobral"
                    className="
                    h-20
                    w-auto
                    object-contain
                    drop-shadow-lg
                    "
                />

                <div>
                    <h3 className="font-bold text-xl">
                    Prefeitura de Sobral
                    </h3>

                    <p className="text-blue-200 text-sm">
                    Sistema de Informações Geográficas
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck
                size={26}
              />

              <h2 className="text-2xl font-bold">
                Área Administrativa
              </h2>
            </div>

            <h1
              className="
                text-4xl
                font-extrabold
                text-blue-100
                leading-tight
              "
            >
              Bem-vindo ao
            </h1>

            <h1
              className="
                text-5xl
                font-black
                text-white
                mb-6
              "
            >
              Sobral em Mapas
            </h1>

            <p className="text-blue-100 leading-relaxed">
              O acesso às configurações,
              gerenciamento de camadas,
              usuários e ferramentas
              administrativas é restrito
              aos membros autorizados da
              administração municipal.
            </p>
          </div>

          <div
            className="
              bg-white/10
              border-2
              border-white/10
              rounded-2xl
              p-5
              backdrop-blur
              border-dashed 
              border-blue-500
            "
          >
            <p className="text-sm text-blue-100">
              Este ambiente é protegido e
              monitorado. Todas as ações
              administrativas são
              registradas para fins de
              auditoria e segurança.
            </p>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="p-10 flex flex-col">
          {/* TABS */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() =>
                setTab("login")
              }
              className={`
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  tab === "login"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-600"
                }
              `}
            >
              Login
            </button>

            <button
              onClick={() =>
                setTab("cadastro")
              }
              className={`
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  tab === "cadastro"
                    ? "bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-600"
                }
              `}
            >
              Solicitar Cadastro
            </button>
          </div>

          {/* LOGIN */}
          {tab === "login" && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">
                  Entrar
                </h2>

                <p className="text-gray-500 mt-2">
                  Utilize suas credenciais
                  institucionais.
                </p>
              </div>

              {error && (
                <div
                  className="
                    mb-5
                    bg-red-50
                    border
                    border-red-200
                    text-red-700
                    rounded-xl
                    p-4
                  "
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        pl-11
                        pr-4
                        py-3
                        border
                        rounded-xl
                        outline-none
                        focus:border-blue-500
                      "
                      placeholder="usuario@prefeitura.gov.br"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Senha
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        pl-11
                        pr-4
                        py-3
                        border
                        rounded-xl
                        outline-none
                        focus:border-blue-500
                      "
                    />
                  </div>

                  <button
                    type="button"
                    className="
                      mt-2
                      text-sm
                      text-blue-700
                      underline
                      hover:text-blue-900
                    "
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <button
                  type="submit"
                  className="
                    w-full
                    bg-blue-700
                    hover:bg-blue-800
                    text-white
                    py-3
                    rounded-xl
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition
                  "
                >
                  <LogIn size={18} />
                  Entrar
                </button>
              </form>
            </>
          )}

          {/* CADASTRO */}
          {tab === "cadastro" && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Solicitação de Cadastro
              </h2>

              <p className="text-gray-500 mb-6">
                Solicite acesso ao sistema
                para análise da equipe
                administradora.
              </p>

              <div
                className="
                  flex-1
                  rounded-2xl
                  border-2
                  border-dashed
                  border-gray-200
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  p-10
                "
              >
                <UserPlus
                  size={56}
                  className="text-blue-600 mb-4"
                />

                <h3 className="font-bold text-lg">
                  Cadastro em breve
                </h3>

                <p className="text-gray-500 mt-2 max-w-md">
                  O fluxo de solicitação de
                  acesso será integrado ao
                  backend futuramente,
                  permitindo aprovação pela
                  administração do sistema.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
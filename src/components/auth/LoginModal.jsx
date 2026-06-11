import React, { useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthBanner from "./AuthBanner";
import { useAuth } from "../../context/AuthContext";

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess
}) {
  const [tab, setTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/login",
        {
          email,
          password,
        }
      );

      login(
        response.data.user,
        response.data.token
      );

      if (response.data.success) {
        localStorage.setItem(
          "admin_token",
          response.data.token
        );

        localStorage.setItem(
          "user_data",
          JSON.stringify(response.data.user)
        );

        window.dispatchEvent(
          new Event("userStateChanged")
        );

        if (onLoginSuccess) {
          onLoginSuccess(
            response.data.user
          );
        }

        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Falha ao autenticar."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
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

        <AuthBanner />

        <div className="p-10 flex flex-col">
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setTab("login")}
              className={`px-5 py-3 rounded-xl font-semibold transition ${
                tab === "login"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setTab("cadastro")}
              className={`px-5 py-3 rounded-xl font-semibold transition ${
                tab === "cadastro"
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Cadastre-se
            </button>
          </div>

          {tab === "login" ? (
            <LoginForm
              email={email}
              password={password}
              showPassword={showPassword}
              loading={loading}
              error={error}
              setEmail={setEmail}
              setPassword={setPassword}
              setShowPassword={setShowPassword}
              handleLogin={handleLogin}
            />
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </div>
  );
}
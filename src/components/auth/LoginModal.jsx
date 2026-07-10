import { useState } from "react";
import { X } from "lucide-react";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import AuthBanner from "./AuthBanner";

import { useAuth } from "../../context/AuthContext";
import { loginRequest } from "../../services/authService";

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}) {
  const [tab, setTab] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const { login } = useAuth();

  const handleTabChange = (nextTab) => {
    if (loading) return;

    setTab(nextTab);
    setError("");

    if (nextTab === "cadastro") {
      setSuccessMessage("");
    }
  };

  const handleRegistrationSuccess = ({
    email: registeredEmail,
    message,
  }) => {
    setEmail(registeredEmail);
    setPassword("");
    setError("");
    setSuccessMessage(message);
    setTab("login");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await loginRequest(
        email,
        password
      );

      if (!response.success) {
        setError(
          response.message ||
            "Não foi possível realizar o login."
        );

        return;
      }

      /*
       * O AuthContext já salva o usuário e o token
       * no localStorage e atualiza o Header.
       */
      login(response.user, response.token);

      if (
        typeof onLoginSuccess === "function"
      ) {
        onLoginSuccess(response.user);
      }

      setEmail("");
      setPassword("");
      setShowPassword(false);
      setSuccessMessage("");

      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Falha ao autenticar."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setError("");
    setSuccessMessage("");
    setPassword("");
    setShowPassword(false);
    setTab("login");

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
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
        onClick={(event) =>
          event.stopPropagation()
        }
        className="
          relative
          w-full
          max-w-5xl
          max-h-[92vh]
          bg-white
          rounded-3xl
          overflow-hidden
          shadow-2xl
          grid
          grid-cols-1
          lg:grid-cols-2
        "
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
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
            bg-white/90
            hover:bg-gray-100
            hover:text-red-600
            disabled:opacity-50
            transition
            z-20
          "
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="hidden lg:block">
          <AuthBanner />
        </div>

        <div className="p-6 sm:p-8 lg:p-10 flex flex-col overflow-y-auto max-h-[92vh]">
          <div className="flex gap-2 mb-7 pr-12">
            <button
              type="button"
              onClick={() =>
                handleTabChange("login")
              }
              className={`
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  tab === "login"
                    ? "bg-blue-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() =>
                handleTabChange("cadastro")
              }
              className={`
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
                ${
                  tab === "cadastro"
                    ? "bg-blue-700 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
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
              successMessage={successMessage}
              setEmail={(value) => {
                setEmail(value);

                if (error) {
                  setError("");
                }
              }}
              setPassword={(value) => {
                setPassword(value);

                if (error) {
                  setError("");
                }
              }}
              setShowPassword={
                setShowPassword
              }
              handleLogin={handleLogin}
            />
          ) : (
            <RegisterForm
              onRegistrationSuccess={
                handleRegistrationSuccess
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
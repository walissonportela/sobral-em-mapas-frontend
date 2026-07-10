import { useState } from "react";
import {
  UserPlus,
  User,
  Mail,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { registerVisitor } from "../../services/authService";

const initialForm = {
  name: "",
  email: "",
  login: "",
  password: "",
  password_confirmation: "",
};

export default function RegisterForm({
  onRegistrationSuccess,
}) {
  const [form, setForm] = useState(initialForm);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setGeneralError("");
    setFieldErrors({});

    try {
      const response = await registerVisitor(form);

      setForm(initialForm);

      if (typeof onRegistrationSuccess === "function") {
        onRegistrationSuccess({
          email: form.email,
          message: response.message,
        });
      }
    } catch (error) {
      const responseData = error.response?.data;

      if (responseData?.errors) {
        setFieldErrors(responseData.errors);
      }

      setGeneralError(
        responseData?.message ||
          "Não foi possível realizar o cadastro."
      );
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field) => {
    const messages = fieldErrors[field];

    return Array.isArray(messages)
      ? messages[0]
      : messages;
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <UserPlus size={27} />
        </div>

        <div>
          <h2 className="text-3xl font-black text-slate-800">
            Crie sua conta
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Cadastre-se como visitante do Sobral em Mapas.
          </p>
        </div>
      </div>

      <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck
          size={20}
          className="text-amber-700 shrink-0 mt-0.5"
        />

        <p className="text-sm text-amber-800 leading-relaxed">
          Após o cadastro, sua conta ficará pendente até ser
          aprovada pela administração.
        </p>
      </div>

      {generalError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
          {generalError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <FormField
          label="Nome completo"
          error={getFieldError("name")}
        >
          <User
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              handleChange("name", event.target.value)
            }
            disabled={loading}
            required
            autoComplete="name"
            placeholder="Digite seu nome completo"
            className={getInputClass(
              Boolean(getFieldError("name"))
            )}
          />
        </FormField>

        <FormField
          label="E-mail"
          error={getFieldError("email")}
        >
          <Mail
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              handleChange("email", event.target.value)
            }
            disabled={loading}
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className={getInputClass(
              Boolean(getFieldError("email"))
            )}
          />
        </FormField>

        <FormField
          label="Login"
          error={getFieldError("login")}
        >
          <AtSign
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={form.login}
            onChange={(event) =>
              handleChange("login", event.target.value)
            }
            disabled={loading}
            required
            autoComplete="username"
            placeholder="Escolha um login"
            className={getInputClass(
              Boolean(getFieldError("login"))
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <FormField
            label="Senha"
            error={getFieldError("password")}
          >
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) =>
                handleChange("password", event.target.value)
              }
              disabled={loading}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              className={`${getInputClass(
                Boolean(getFieldError("password"))
              )} pr-12`}
            />

            <PasswordToggle
              visible={showPassword}
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
            />
          </FormField>

          <FormField
            label="Confirmar senha"
            error={getFieldError("password_confirmation")}
          >
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type={
                showPasswordConfirmation
                  ? "text"
                  : "password"
              }
              value={form.password_confirmation}
              onChange={(event) =>
                handleChange(
                  "password_confirmation",
                  event.target.value
                )
              }
              disabled={loading}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Repita sua senha"
              className={`${getInputClass(
                Boolean(
                  getFieldError("password_confirmation")
                )
              )} pr-12`}
            />

            <PasswordToggle
              visible={showPasswordConfirmation}
              onClick={() =>
                setShowPasswordConfirmation(
                  (previous) => !previous
                )
              }
            />
          </FormField>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            h-14
            rounded-2xl
            bg-gradient-to-r
            from-blue-700
            to-blue-800
            text-white
            font-bold
            shadow-lg
            hover:from-blue-800
            hover:to-blue-900
            disabled:opacity-60
            disabled:cursor-not-allowed
            transition
            flex
            items-center
            justify-center
            gap-2
          "
        >
          {loading ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />
              Criando conta...
            </>
          ) : (
            <>
              <UserPlus size={19} />
              Solicitar cadastro
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>

      <div className="relative">
        {children}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600 mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordToggle({
  visible,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition"
      aria-label={
        visible
          ? "Ocultar senha"
          : "Mostrar senha"
      }
    >
      {visible ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>
  );
}

function getInputClass(hasError) {
  return `
    w-full
    pl-11
    pr-4
    py-3
    rounded-2xl
    border
    outline-none
    transition
    disabled:bg-slate-100
    disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    }
  `;
}
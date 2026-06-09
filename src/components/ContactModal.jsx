import React, { useState } from "react";
import {
  X,
  Mail,
  User,
  Phone,
  MessageSquare,
  Send,
  FileText,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";

export default function ContactModal({
  isOpen,
  onClose,
}) {
  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      category: "",
      subject: "",
      message: "",
    });

    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(false);

    try {
      setLoading(true);

      const response =
        await api.post(
          "/contact",
          form
        );

      if (
        response.data.success
      ) {
        setSuccess(true);

        setForm({
          name: "",
          email: "",
          phone: "",
          category: "",
          subject: "",
          message: "",
        });
      }
    } catch (error) {
      console.error(error);

      if (
        error.response?.status ===
        422
      ) {
        setError(
          "Preencha todos os campos obrigatórios."
        );
      } else if (
        error.response?.status ===
        404
      ) {
        setError(
          "Rota /contact não encontrada no backend."
        );
      } else if (
        error.response?.status >=
        500
      ) {
        setError(
          "Erro interno do servidor."
        );
      } else {
        setError(
          error.response?.data
            ?.message ||
            "Não foi possível enviar sua mensagem."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="
        fixed
        inset-0
        bg-black/60
        backdrop-blur-sm
        z-[2000]
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
          bg-white
          w-full
          max-w-4xl
          rounded-3xl
          overflow-hidden
          shadow-2xl
          grid
          md:grid-cols-2
        "
      >
        {/* ESQUERDA */}
        <div
          className="
            bg-gradient-to-br
            from-blue-700
            via-blue-800
            to-blue-900
            text-white
            p-8
            flex
            flex-col
            justify-between
          "
        >
          <div>
            <div
              className="
                h-16
                w-16
                rounded-2xl
                bg-white/15
                flex
                items-center
                justify-center
                mb-6
              "
            >
              <Mail size={30} />
            </div>

            <h2 className="text-3xl font-bold mb-3">
              Entre em Contato
            </h2>

            <p className="text-blue-100 leading-relaxed">
              Utilize este canal
              para enviar dúvidas,
              sugestões, solicitar
              correções de dados ou
              comunicar problemas
              encontrados no sistema
              Sobral em Mapas.
            </p>
          </div>

          <div
            className="
              mt-8
              border
              border-dashed
              border-white/30
              rounded-2xl
              p-5
              bg-white/5
            "
          >
            <h3 className="font-semibold mb-2">
              Atendimento
            </h3>

            <p className="text-sm text-blue-100">
              Sua solicitação será
              encaminhada
              diretamente para a
              equipe responsável
              pela administração da
              plataforma.
            </p>
          </div>
        </div>

        {/* DIREITA */}
        <div className="relative p-8">
          <button
            onClick={handleClose}
            className="
              absolute
              top-5
              right-5
              text-gray-400
              hover:text-red-600
              transition
            "
          >
            <X size={22} />
          </button>

          {!success ? (
            <>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                Fale Conosco
              </h3>

              <p className="text-sm text-slate-500 mb-6">
                Preencha os campos
                abaixo.
              </p>

              {error && (
                <div
                  className="
                    mb-4
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-4"
              >
                {/* NOME */}
                <div className="relative">
                  <User
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value.replace(
                          /[0-9]/g,
                          ""
                        ),
                      })
                    }
                    placeholder="Nome completo"
                    required
                    className="
                      w-full
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-3
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* EMAIL */}
                <div className="relative">
                  <Mail
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="email@exemplo.com"
                    required
                    className="
                      w-full
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-3
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* TELEFONE */}
                <div className="relative">
                  <Phone
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");

                      if (value.length > 11) {
                        value = value.slice(0, 11);
                      }

                      if (value.length > 6) {
                        value = value.replace(
                          /^(\d{2})(\d{5})(\d+)/,
                          "($1) $2-$3"
                        );
                      } else if (value.length > 2) {
                        value = value.replace(
                          /^(\d{2})(\d+)/,
                          "($1) $2"
                        );
                      } else if (value.length > 0) {
                        value = value.replace(
                          /^(\d+)/,
                          "($1"
                        );
                      }

                      setForm({
                        ...form,
                        phone: value,
                      });
                    }}
                    placeholder="(88) 99999-9999"
                    className="
                      w-full
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-3
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />
                </div>

                {/* CATEGORIA */}
                <select
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="
                    w-full
                    border
                    rounded-xl
                    px-4
                    py-3
                    outline-none
                    focus:border-blue-500
                  "
                >
                  <option value="">
                    Categoria
                  </option>
                  <option value="Sugestão">
                    Sugestão
                  </option>
                  <option value="Erro">
                    Reportar Erro
                  </option>
                  <option value="Dados">
                    Dados Geográficos
                  </option>
                  <option value="Suporte">
                    Suporte Técnico
                  </option>
                  <option value="Outro">
                    Outro
                  </option>
                </select>

                {/* ASSUNTO */}
                <div className="relative">
                  <FileText
                    size={16}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="text"
                    name="subject"
                    value={
                      form.subject
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Assunto"
                    required
                    className="
                      w-full
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-3
                      outline-none
                      focus:border-blue-500
                    "
                  />
                </div>

                {/* MENSAGEM */}
                <div className="relative">
                  <MessageSquare
                    size={16}
                    className="
                      absolute
                      left-3
                      top-4
                      text-gray-400
                    "
                  />

                  <textarea
                    rows="5"
                    name="message"
                    value={
                      form.message
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Descreva sua solicitação..."
                    required
                    className="
                      w-full
                      border
                      rounded-xl
                      pl-10
                      pr-4
                      py-3
                      resize-none
                      outline-none
                      focus:border-blue-500
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    bg-blue-700
                    hover:bg-blue-800
                    text-white
                    rounded-xl
                    py-3
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition
                  "
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div
              className="
                h-full
                flex
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <CheckCircle2
                size={70}
                className="text-green-500 mb-4"
              />

              <h3 className="text-2xl font-bold text-slate-800">
                Mensagem enviada!
              </h3>

              <p className="text-slate-500 mt-2 max-w-sm">
                Sua solicitação foi
                encaminhada para a
                administração do
                sistema.
              </p>

              <button
                onClick={
                  handleClose
                }
                className="
                  mt-6
                  px-6
                  py-3
                  rounded-xl
                  bg-blue-700
                  text-white
                "
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
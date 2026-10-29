import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Info,
  Mail,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
  Menu, 
  X 
} from "lucide-react";

import LoginModal from "./auth/LoginModal";
import ContactModal from "./ContactModal";
import { useAuth } from "../context/AuthContext";

export default function Header({ onStartTutorial }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para o menu de celular

  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const role = user?.profile?.nome;
  const isAdmin = ["Superadministrador", "Administrador"].includes(role);

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <>
      <header
        className="
          fixed top-0 left-0 right-0 h-[85px] z-[1200]
          flex items-center justify-between
          bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900
          border-b border-blue-600 shadow-lg
          px-3 md:px-6 gap-2
        "
      >
        {/* IDENTIDADE VISUAL - funciona no desktop e no celular */}
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          {/* Marca da prefeitura: visível quando há espaço suficiente */}
          <img
            src="/images/Logo_Sobral.png"
            alt="Prefeitura de Sobral"
            className="hidden lg:block h-12 w-auto object-contain flex-shrink-0"
          />

          <div className="hidden lg:block h-9 w-px bg-white/20 flex-shrink-0" />

          <Link
            to="/"
            className="flex items-center gap-2.5 md:gap-3 min-w-0 group"
            aria-label="Sobral em Mapas — página inicial"
          >
            {/* Novo símbolo criado no Figma; sem o antigo fundo amarelo */}
            <img
              src="/images/icone_sobral_em_mapas.png"
              alt=""
              aria-hidden="true"
              className="
                h-[70px]
                w-auto
                max-w-none
                flex-shrink-0
                object-contain
                transition-transform
                duration-200
                group-hover:scale-105
              "
            />

            {/* Nome e subtítulo */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="hidden md:block text-xl lg:text-[30px] font-extrabold tracking-tight leading-tight whitespace-nowrap">
                  <span className="text-white">Sobral</span>{" "}
                  <span className="text-blue-100 font-semibold">em</span>{" "}
                  <span className="text-amber-300">Mapas</span>
                </h1>

                {/* Título compacto para telas pequenas */}
                <div className="md:hidden flex flex-col text-white font-extrabold text-[15px] sm:text-[17px] leading-[1.08] tracking-tight">
                  <span>Sobral</span>
                  <span><span className="font-semibold">em</span> <span className="text-amber-300">Mapas</span></span>
                </div>

                <span className="hidden xl:inline-flex rounded-full px-2 py-0.5
                                 bg-amber-400/15 text-amber-200 border border-amber-300/30
                                 text-[10px] font-bold tracking-widest leading-none">
                  SIG
                </span>
              </div>

              <p className="hidden md:block mt-0.5 text-[13px] lg:text-xs text-blue-100/90 tracking-wide whitespace-nowrap">
                Sistema de Informações Geográficas
                <span className="hidden 2xl:inline"> • Prefeitura de Sobral</span>
              </p>
            </div>
          </Link>
        </div>

        {/* ÁREA DIREITA (Botões e Perfil) */}
        <div className="ml-auto flex items-center gap-2 z-10">
          
          {/* BOTÕES DESKTOP */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              data-tour="tutorial-button"
              onClick={onStartTutorial}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <BookOpen size={16} />
              <span>Tutorial</span>
            </button>

            <button
              type="button"
              data-tour="contact-button"
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <Mail size={16} />
              <span>Contato</span>
            </button>

            <Link
              to="/sobre"
              data-tour="about-button"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all"
            >
              <Info size={16} />
              <span>Sobre</span>
            </Link>

            <div className="h-8 w-px bg-white/20 mx-1" />

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-4 py-2 mr-1 rounded-xl text-amber-400 hover:bg-white/10 transition-all font-semibold"
                title="Painel administrativo"
                aria-label="Abrir painel administrativo"
              >
                <Settings size={18} />
              </Link>
            )}
          </div>

          {/* ÁREA DE LOGIN / PERFIL (Mantida em todas as telas) */}
          {user ? (
            <div className="relative" ref={dropdownRef} data-tour="login-area">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 md:gap-2 pl-1 pr-1 md:pr-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
              >
                <div className="h-7 w-7 md:h-8 md:w-8 bg-amber-400 text-blue-900 rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                  {getInitial(user.name)}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-white transition-transform duration-300 ease-out ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

                <div
                    className={`
                      absolute
                      right-0
                      top-full
                      mt-3
                      w-56
                      md:w-64
                      bg-white
                      rounded-2xl
                      shadow-xl
                      border
                      border-gray-100
                      overflow-hidden
                      z-50

                      transition-all
                      duration-200
                      ease-out
                      origin-top-right

                      ${
                        isDropdownOpen
                          ? "opacity-100 translate-y-0 scale-100 blur-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 scale-95  blur-[2px] pointer-events-none"
                      }
                    `}
                  >
                   {/* Conteúdo do Dropdown mantido igual ao seu original */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-800 truncate" title={user.name}>{user.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5" title={user.email}>{user.email}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase mt-2 tracking-wider">
                      {user.profile?.nome || "Visitante"}
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link to="/minha-conta" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-blue-700 hover:bg-blue-50 rounded-xl transition font-medium text-sm">
                      <UserCircle size={18} /> Minha conta
                    </Link>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition font-medium text-sm">
                      <LogOut size={18} /> Sair do Sistema
                    </button>
                  </div>
                </div>
            </div>
          ) : (
            <button
              type="button"
              data-tour="login-area"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl bg-amber-400 text-blue-900 font-semibold shadow-md hover:bg-amber-300 hover:scale-105 transition-all text-sm md:text-base"
            >
              <User size={16} />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          {/* BOTÃO DO MENU MOBILE (Aparece apenas < 1024px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all ml-1"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MENU DROPDOWN MOBILE */}
        <div
            className={`
              lg:hidden
              fixed
              top-[85px]
              left-0
              right-0

              bg-blue-900
              border-b
              border-blue-800
              shadow-xl

              px-4
              py-4

              flex
              flex-col
              gap-2

              z-[1100]

              transition-all
              duration-300
              ease-out
              origin-top

              ${
                isMobileMenuOpen
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 -translate-y-4  blur-[2px] pointer-events-none"
              }
            `}
          >
          <button
            onClick={() => { onStartTutorial(); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-left"
          >
            <BookOpen size={18} />
            <span className="font-medium">Tutorial</span>
          </button>
          
          <button
            onClick={() => { setIsContactOpen(true); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-left"
          >
            <Mail size={18} />
            <span className="font-medium">Contato</span>
          </button>

          <Link
            to="/sobre"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-left"
          >
            <Info size={18} />
            <span className="font-medium">Sobre</span>
          </Link>

          {isAdmin && (
            <>
              <div className="h-px bg-white/20 my-2 mx-2" />
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-400 hover:bg-white/10 transition-all text-left"
              >
                <Settings size={18} />
                <span className="font-medium">Painel Administrativo</span>
              </Link>
            </>
          )}
        </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
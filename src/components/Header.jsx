import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Info,
  Mail,
  BookOpen,
  Settings,
  Map as MapIcon,
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
  const isAdmin = ["Administrador", "Agente"].includes(role);

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <>
      <header
        className="
          fixed
          top-0
          left-0
          right-0
          h-[72px]
          z-[1200]
          bg-gradient-to-r
          from-blue-700
          via-blue-800
          to-blue-900
          border-b
          border-blue-600
          shadow-lg
          flex
          items-center
          px-3 md:px-6 /* Reduzido padding no mobile */
        "
      >

        
        {/* LOGO + IDENTIDADE DO SISTEMA */}
        <div className="flex items-center gap-4 flex-shrink-0">

          {/* Logo */}
          <div className="flex items-center justify-center">
            <img
              src="/images/Logo_Sobral.png"
              alt="Prefeitura de Sobral"
              className="
                h-7
                sm:h-9
                md:h-12
                w-auto
                object-contain
              "
            />
          </div>

          {/* ===== DESKTOP ===== */}
          <div className="hidden md:flex items-center gap-4">

            <div className="h-10 w-px bg-white/20" />

            <div
              className="
                h-12
                w-12
                rounded-2xl
                bg-gradient-to-br
                from-amber-400
                to-amber-500
                shadow-lg
                flex
                items-center
                justify-center
                ring-2
                ring-white/10
              "
            >
              <MapIcon
                size={24}
                className="text-blue-900"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-black tracking-tight text-white">
                  Sobral em Mapas
                </h1>

                <span
                  className="
                    hidden
                    xl:inline-flex
                    px-2
                    py-0.5
                    rounded-full
                    bg-emerald-500/20
                    border
                    border-emerald-300/20
                    text-emerald-200
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-widest
                  "
                >
                  SIG
                </span>

              </div>

              <span className="text-xs text-blue-200 tracking-wide">
                Sistema de Informações Geográficas • Prefeitura de Sobral
              </span>
            </div>

          </div>

          {/* ===== MOBILE ===== */}
          <div className="flex md:hidden items-center gap-2">

            <div
              className="
                h-8
                w-8
                rounded-xl
                bg-gradient-to-br
                from-amber-400
                to-amber-500
                flex
                items-center
                justify-center
                shadow
              "
            >
              <MapIcon
                size={16}
                className="text-blue-900"
              />
            </div>

            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold text-white">
                Sobral
              </span>

              <span className="text-[15px] font-extrabold text-white">
                em Mapas
              </span>

            </div>

          </div>

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
              top-[72px]
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
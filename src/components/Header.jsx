import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Importante para o botão de administração
import {
  User,
  Info,
  Mail,
  BookOpen,
  Bell, // Mantive caso você vá usar depois
  Settings,
  Map as MapIcon,
  LogOut,
  ChevronDown
} from "lucide-react";

import LoginModal from "./auth/LoginModal";
import ContactModal from "./ContactModal";

import { useAuth } from "../context/AuthContext";

export default function Header() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };
  const role = user?.profile?.nome;

  const isAdmin = [
    "Administrador",
    "Agente"
  ].includes(role);

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
          h-[62px]
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
          px-6
        "
      >
        {/* LOGO */}
        <div className="flex items-center z-10">
          <div
            className="
              h-12
              px-2
              rounded-xl
              backdrop-blur
              flex
              items-center
              justify-center
            "
          >
            <img
              src="/Logo_Sobral.png"
              alt="Prefeitura de Sobral"
              className="
                h-12
                w-auto
                object-contain
              "
            />
          </div>
        </div>

        {/* TÍTULO CENTRAL */}
        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            text-center
            pointer-events-none
          "
        >
          <div className="flex items-center justify-center gap-2">
            <MapIcon
              size={22}
              className="text-amber-400"
            />

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Sobral em Mapas
            </h1>
          </div>
        </div>

        {/* MENU DIREITA */}
        <div className="ml-auto flex items-center gap-2 z-10">
          <button
            className="
              hidden
              lg:flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              text-white
              hover:bg-white/10
              transition-all
            "
          >
            <BookOpen size={16} />
            <span>Tutorial</span>
          </button>

          <button
            onClick={() => setIsContactOpen(true)}
            className="
              hidden
              lg:flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              text-white
              hover:bg-white/10
              transition-all
            "
          >
            <Mail size={16} />
            <span>Contato</span>
          </button>

          <button
            className="
              hidden
              lg:flex
              items-center
              gap-2
              px-4
              py-2
              rounded-xl
              text-white
              hover:bg-white/10
              transition-all
            "
          >
            <Info size={16} />
            <span>Sobre</span>
          </button>

          <div className="hidden xl:block h-8 w-px bg-white/20 mx-1" />

          {/* === BOTÃO DE ADMINISTRAÇÃO (APENAS PARA ADMINS) === */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="
                hidden
                lg:flex
                items-center
                gap-2
                px-4
                py-2
                mr-1
                rounded-xl
                text-amber-400
                hover:bg-white/10
                transition-all
                font-semibold
              "
            >
              <Settings size={18} />
            </Link>
          )}

          {/* === AVATAR DO USUÁRIO LOGADO OU BOTÃO DE LOGIN === */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="
                  flex 
                  items-center 
                  gap-2 
                  pl-1 
                  pr-2 
                  py-1 
                  rounded-full 
                  bg-white/10 
                  hover:bg-white/20 
                  transition-all 
                  border 
                  border-white/10
                "
              >
                <div className="h-8 w-8 bg-amber-400 text-blue-900 rounded-full flex items-center justify-center font-bold text-sm">
                  {getInitial(user.name)}
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* MENU DROPDOWN */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-800 truncate" title={user.name}>
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5" title={user.email}>
                      {user.email}
                    </p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase mt-2 tracking-wider">
                      {user.profile?.nome || "Visitante"}
                    </p>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition font-medium text-sm"
                    >
                      <LogOut size={18} />
                      Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="
                flex
                items-center
                gap-2
                px-5
                py-2.5
                rounded-2xl
                bg-amber-400
                text-blue-900
                font-semibold
                shadow-md
                hover:bg-amber-300
                hover:scale-105
                transition-all
              "
            >
              <User size={16} />
              Login
            </button>
          )}

        </div>
      </header>

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
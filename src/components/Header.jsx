import React, { useState } from "react";
import {
  User,
  Info,
  Mail,
  BookOpen,
  Bell,
  Settings,
  Map as MapIcon,
} from "lucide-react";

import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";

export default function Header({
  onLoginSuccess,
}) {
  const [isLoginModalOpen, setIsLoginModalOpen] =
    useState(false);
  const [isContactOpen, setIsContactOpen] =
  useState(false);

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

          <button
            onClick={() =>
              setIsLoginModalOpen(true)
            }
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
        </div>
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() =>
          setIsLoginModalOpen(false)
        }
        onLoginSuccess={onLoginSuccess}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </>
  );
}
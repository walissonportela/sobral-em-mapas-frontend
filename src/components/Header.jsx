import React, { useState } from 'react';
import { User, Info, Mail, BookOpen, Map as MapIcon } from 'lucide-react';
import LoginModal from './LoginModal';

export default function Header({ onLoginSuccess }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      {/* Bloco de Estilos Encapsulado (Seguro para CSP) */}
      <style>{`
        :root {
          --header-bg: #0400ff;         /* Azul Principal */
          --header-accent: #facc15;     /* Amarelo de Destaque */
          --header-text: #ffffff;       /* Branco para textos */
          --nav-divider: #60a5fa;       /* Azul Claro para a linha divisória */
          --btn-bg: #facc15;            /* Fundo do botão de Login */
          --btn-bg-hover: #eab308;      /* Hover do botão */
          --btn-text: #0040f0;          /* Texto do botão */
        }

        .header-container {
          height: 4rem;
          background-color: var(--header-bg);
          color: var(--header-text);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          position: relative;
          border-bottom: 4px solid var(--header-accent);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-logo {
          padding: 0.375rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s ease-in-out;
        }

        .header-logo:hover {
          transform: scale(1.05);
        }

        .header-logo img {
          height: 2.25rem;
          width: auto;
          object-fit: contain;
        }

        .header-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-title-icon {
          color: var(--header-accent);
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.025em;
          margin: 0;
        }

        .header-title span {
          color: var(--header-accent);
        }

        .header-nav {
          display: none;
          align-items: center;
          gap: 1rem;
        }

        /* Oculta o menu em telas pequenas, mostra em desktop */
        @media (min-width: 1024px) {
          .header-nav {
            display: flex;
          }
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          color: var(--header-text);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--header-accent);
        }

        .nav-divider {
          height: 1.5rem;
          width: 1px;
          background-color: var(--nav-divider);
          margin: 0 0.5rem;
        }

        .login-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--btn-bg);
          color: var(--btn-text);
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .login-btn:hover {
          background-color: var(--btn-bg-hover);
        }

        .login-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Estrutura HTML/JSX do Cabeçalho */}
      <header className="header-container">
        
        {/* Lado Esquerdo: Logo e Título */}
        <div className="header-left">
          <div className="header-logo">
            <img 
              src="/Logo_Sobral.png" 
              alt="Prefeitura de Sobral" 
            />
          </div>

          <div className="header-title-wrapper">
            <MapIcon size={24} className="header-title-icon" />
            <h1 className="header-title">
              Sobral em <span>Mapas</span>
            </h1>
          </div>
        </div>

        {/* Lado Direito: Navegação e Login */}
        <nav className="header-nav">
          <a href="#" className="nav-link">
            <BookOpen size={18} /> 
            <span>Tutorial</span>
          </a>
          <a href="#" className="nav-link">
            <Mail size={18} /> 
            <span>Contato</span>
          </a>
          <a href="#" className="nav-link">
            <Info size={18} /> 
            <span>Sobre</span>
          </a>
          
          <div className="nav-divider"></div>

          {/* Botão de abrir o modal */}
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="login-btn"
          >
            <User size={18} /> 
            LOGIN
          </button>
        </nav>
      </header>

      {/* Componente do Modal Injetado no Fim */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={onLoginSuccess} 
      />
    </>
  );
}
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ShieldCheck,
  UserCircle,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
  UserPlus
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function AdminTopbar() {
  const { user, logout } = useAuth(); 
  
  // Estados para os dropdowns
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Referências para detectar clique fora
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const initial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

  // Lista vazia pronta para receber dados reais da sua API futuramente
  const notifications = [];

  // Fecha os menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    setIsDropdownOpen(false);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Mantive a função de ícones para facilitar quando você trouxer os dados reais
  const getNotifIcon = (type) => {
    switch (type) {
      case 'user_request': return <UserPlus size={16} className="text-blue-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 lg:px-8 flex items-center justify-between transition-all">
      
      {/* Lado Esquerdo: Navegação e Título */}
      <div className="flex items-center gap-3 md:gap-4">
        <Link
          to="/"
          className="lg:hidden h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0"
          title="Voltar ao mapa"
        >
          <ArrowLeft size={18} className="md:w-5 md:h-5" />
        </Link>

        <div className="flex flex-col justify-center min-w-0">
          <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight truncate">
            Painel Administrativo
          </h2>
          <p className="hidden md:block text-sm text-slate-500 mt-0.5 truncate">
            Gerencie dados e recursos do Sobral em Mapas.
          </p>
        </div>
      </div>

      {/* Lado Direito: Ações e Perfil */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        
        {/* CONTAINER DE NOTIFICAÇÕES */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsDropdownOpen(false); 
            }}
            className={`relative h-9 w-9 md:h-11 md:w-11 rounded-full md:rounded-2xl border flex items-center justify-center transition-all
              ${isNotifOpen 
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600'
              }`}
          >
            <Bell size={18} className="md:w-5 md:h-5" />
            
            {/* Indicador de quantidade não lida */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-500 border-2 border-white text-white text-[9px] md:text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* MENU DROPDOWN DE NOTIFICAÇÕES */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Notificações</h3>
                <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                  Marcar como lidas
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition flex gap-3 ${notif.unread ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div>
                        <p className={`text-sm ${notif.unread ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {notif.description}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {notif.time}
                        </p>
                      </div>
                      {notif.unread && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 ml-auto"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-500">Nenhuma notificação nova.</p>
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <Link to="/admin/usuarios" onClick={() => setIsNotifOpen(false)} className="block w-full py-2 text-center text-xs font-bold text-slate-600 hover:text-blue-600 transition">
                  Ver todas as solicitações
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:block w-px h-8 bg-slate-200 mx-1"></div>

        {/* CONTAINER DO DROPDOWN DE PERFIL */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotifOpen(false); 
            }}
            className="flex items-center gap-2 md:gap-3 p-1 md:pr-4 rounded-full md:rounded-2xl border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all text-left"
          >
            <div className="h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold shadow-sm border-2 border-white">
              {initial}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {user?.name || "Usuário"}
              </p>
              <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-1 uppercase tracking-wider">
                <ShieldCheck size={12} />
                {user?.profile?.nome || "Administrador"}
              </p>
            </div>

            <ChevronDown 
              size={16} 
              className={`hidden sm:block text-slate-400 ml-1 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} 
            />
          </button>

          {/* MENU DROPDOWN DE PERFIL */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <Link 
                to="/minha-conta" 
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                <UserCircle size={18} />
                Minha conta
              </Link>
              
              <div className="h-px bg-slate-100 my-1 mx-4"></div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Sair do Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
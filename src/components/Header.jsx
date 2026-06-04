import { User, Info, Mail, BookOpen, Map as MapIcon } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-blue-600 text-white grid grid-cols-3 items-center px-6 shadow-xl z-[1000] relative border-b border-blue-500/30">
      
      {/* Coluna 1: Logo (Alinhado à Esquerda) */}
      <div className="flex items-center">
        <div className="bg-white/10 p-1.5 rounded-wall backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
          <img 
            src="/Logo_Sobral.png" 
            alt="Prefeitura de Sobral" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* Coluna 2: Título Centralizado com Ícone */}
      <div className="flex items-center justify-center gap-3">
        <div className="bg-yellow-400 p-2 rounded-wall shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
          <MapIcon size={22} className="text-blue-800" />
        </div>
        <h1 className="text-2xl font-black tracking-tight drop-shadow-md whitespace-nowrap">
          Sobral em <span className="text-yellow-400 uppercase">Mapas</span>
        </h1>
      </div>

      {/* Coluna 3: Navegação (Alinhada à Direita) */}
      <nav className="hidden lg:flex items-center justify-end gap-2">
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-wall hover:bg-white/10 hover:text-yellow-300 transition-all text-sm font-bold">
          <BookOpen size={18} /> 
          <span>Tutorial</span>
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-wall hover:bg-white/10 hover:text-yellow-300 transition-all text-sm font-bold">
          <Mail size={18} /> 
          <span>Contato</span>
        </a>
        <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-wall hover:bg-white/10 hover:text-yellow-300 transition-all text-sm font-bold">
          <Info size={18} /> 
          <span>Sobre</span>
        </a>
        
        {/* Divisor Visual */}
        <div className="h-6 w-[1px] bg-blue-400/50 mx-2"></div>

        <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-5 py-2 rounded-wall font-black text-sm transition-all transform active:scale-95 shadow-lg border-b-2 border-yellow-600">
          <User size={18} /> 
          LOGIN
        </button>
      </nav>
    </header>
  );
}
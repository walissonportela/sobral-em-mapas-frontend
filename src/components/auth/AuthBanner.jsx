import React from "react";
import { UserCircle } from "lucide-react";

const AuthBanner = () => {
  return (
    <div
      className="
        bg-gradient-to-br
        from-blue-700
        via-blue-800
        to-blue-900
        text-white
        p-10
        flex
        flex-col
        justify-between
      "
    >
      <div>
        <div className="flex items-center gap-4 mb-8">
          <img
            src="/Logo_Sobral.png"
            alt="Sobral"
            className="h-20"
          />

          <div>
            <h3 className="font-bold text-xl">
              Prefeitura de Sobral
            </h3>

            <p className="text-blue-200 text-sm">
              Sistema de Informações Geográficas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <UserCircle size={26} />
          <h2 className="text-2xl font-bold">
            Acesso ao Sistema
          </h2>
        </div>

        <h1 className="text-5xl font-black mb-4">
          Sobral em Mapas
        </h1>

        <p className="text-blue-100 leading-relaxed">
          Faça login para acessar recursos
          exclusivos da plataforma.
        </p>
      </div>

      <div className="bg-white/10 rounded-2xl p-5">
        <p className="text-sm text-blue-100">
          Usuários administrativos possuem
          acesso a ferramentas avançadas de
          gestão de mapas e camadas.
        </p>
      </div>
    </div>
  );
};

export default AuthBanner;
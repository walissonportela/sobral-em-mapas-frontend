import React from "react";
import { UserPlus } from "lucide-react";

const RegisterForm = () => {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-3xl font-bold text-gray-800 mb-3">
        Crie sua conta
      </h2>

      <p className="text-gray-500 mb-6">
        Tenha acesso a ferramentas de personalização.
      </p>

      <div
        className="
          flex-1
          rounded-2xl
          border-2
          border-dashed
          border-gray-200
          flex
          flex-col
          items-center
          justify-center
          text-center
          p-10
        "
      >
        <UserPlus
          size={56}
          className="text-blue-600 mb-4"
        />

        <h3 className="font-bold text-lg">
          Cadastro em breve
        </h3>

        <p className="text-gray-500 mt-2 max-w-md">
          Em breve os visitantes poderão criar
          contas e solicitar acesso.
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
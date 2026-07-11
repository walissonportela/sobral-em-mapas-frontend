import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Map,
  Layers,
  Building2,
  Info,
  MapPinned,
} from "lucide-react";

export default function About() {
  const [imageError, setImageError] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center">
              <Map size={25} />
            </div>

            <div>
              <h1 className="font-black text-xl">
                Sobral em Mapas
              </h1>

              <p className="text-sm text-blue-100">
                Sobre o portal
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 transition font-bold flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar ao mapa
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {!imageError ? (
              <img
                src="/images/sobral.jpg"
                alt="Cidade de Sobral"
                onError={() => setImageError(true)}
                className="w-full h-full min-h-[360px] object-cover"
              />
            ) : (
              <div className="min-h-[360px] bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center p-10 text-center">
                <div>
                  <Building2
                    size={56}
                    className="mx-auto mb-4 text-amber-300"
                  />

                  <h2 className="text-2xl font-black">
                    Sobral
                  </h2>

                  <p className="text-blue-100 mt-2">
                    Adicione uma imagem em public/images/sobral.jpg para exibir aqui.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-sm mb-5">
              <Info size={17} />
              Cidade e tecnologia
            </div>

            <h2 className="text-3xl font-black text-slate-900">
              Sobre Sobral
            </h2>

            <p className="text-slate-600 leading-relaxed mt-4">
              Sobral é uma cidade cearense reconhecida por sua importância regional,
              sua história, sua vida urbana e sua capacidade de integrar desenvolvimento,
              serviços públicos e planejamento territorial.
            </p>

            <p className="text-slate-600 leading-relaxed mt-4">
              O município possui uma dinâmica urbana diversa, com bairros,
              equipamentos públicos, áreas de interesse ambiental, sistemas de mobilidade,
              infraestrutura e serviços que podem ser melhor compreendidos por meio de mapas.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                icon={<MapPinned size={22} />}
                title="Território"
                text="Visualização espacial de dados urbanos e municipais."
              />

              <InfoCard
                icon={<Layers size={22} />}
                title="Camadas"
                text="Organização temática das informações no mapa."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-2xl font-black text-slate-900">
            Sobre o Sobral em Mapas
          </h2>

          <p className="text-slate-600 leading-relaxed mt-4">
            O Sobral em Mapas é uma plataforma WebGIS criada para facilitar o acesso,
            a visualização e a gestão de informações geográficas do município.
            Por meio dele, o usuário pode consultar camadas temáticas, visualizar dados
            no mapa, pesquisar locais, entender informações territoriais e acessar
            recursos úteis para análise urbana.
          </p>

          <p className="text-slate-600 leading-relaxed mt-4">
            A proposta do sistema é aproximar dados geográficos da população,
            dos gestores e das equipes técnicas, tornando o mapa uma ferramenta
            prática para consulta, transparência, planejamento e tomada de decisão.
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
        {icon}
      </div>

      <h3 className="font-black text-slate-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        {text}
      </p>
    </div>
  );
}
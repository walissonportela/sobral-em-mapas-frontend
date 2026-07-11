import { useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Map,
  Layers,
  Building2,
  Info,
  MapPinned,
  Globe2,
  Database,
  Search,
  Printer,
  Ruler,
  ShieldCheck,
  Compass,
  Landmark,
  Users,
} from "lucide-react";

export default function About() {
  const [heroImageError, setHeroImageError] =
    useState(false);

  return (
    <div className="h-screen overflow-y-auto bg-slate-100">
      <section
        className="
          relative
          overflow-hidden
          bg-gradient-to-br
          from-blue-700
          via-blue-800
          to-blue-950
          text-white
          min-h-[600px]
        "
      >
        {!heroImageError && (
          <img
            src="/images/sobral-hero.png"
            alt="Sobral"
            onError={() => setHeroImageError(true)}
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              opacity-75
            "
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/75 to-blue-800/70" />

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-400" />
          <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                text-blue-100
                hover:text-white
                transition
                text-sm
                font-medium
              "
            >
              <ArrowLeft size={18} />
              Voltar para o mapa
            </Link>

            <div
              className="
                hidden
                md:flex
                items-center
                gap-2
                rounded-2xl
                bg-white/10
                border
                border-white/10
                px-4
                py-2
                text-sm
                text-blue-100
                backdrop-blur
              "
            >
              <Map size={17} />
              Sobral em Mapas
            </div>
          </div>

          <div className="mt-15 max-w-4xl pb-10">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-amber-400/15
                border
                border-amber-300/20
                px-3
                py-1
                text-xs
                font-black
                text-amber-300
                uppercase
                tracking-wide
              "
            >
              <Info size={14} />
              Sobre o portal
            </div>

            <h1 className="text-4xl lg:text-6xl font-black mt-15 leading-tight">
              Sobral em Mapas
            </h1>

            <p className="text-blue-100 mt-5 text-lg leading-relaxed max-w-3xl">
              Uma plataforma WebGIS criada para aproximar dados geográficos,
              planejamento urbano e informações públicas em uma experiência
              simples, visual e acessível.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-3xl">
              <HeroMetric
                value="GIS"
                label="Portal geográfico"
              />

              <HeroMetric
                value="WMS"
                label="Camadas integradas"
              />

              <HeroMetric
                value="Mapa"
                label="Consulta territorial"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 pb-16">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="
              lg:col-span-1
              bg-white
              rounded-3xl
              shadow-sm
              border
              border-slate-200
              overflow-hidden
            "
          >
            <div className="p-6 border-b border-slate-100">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Building2 size={26} />
              </div>

              <h2 className="font-black text-slate-800 text-xl mt-4">
                Sobre Sobral
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Cidade, território e planejamento.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Sobral é uma cidade cearense reconhecida por sua importância
                regional, sua história, sua vida urbana e sua capacidade de
                integrar desenvolvimento, serviços públicos e planejamento
                territorial.
              </p>

              <p className="text-slate-600 leading-relaxed">
                O município possui uma dinâmica urbana diversa, com bairros,
                equipamentos públicos, áreas ambientais, sistemas de mobilidade,
                infraestrutura e serviços que podem ser melhor compreendidos por
                meio de mapas.
              </p>
            </div>
          </div>

          <div
            className="
              lg:col-span-2
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            "
          >
            <SummaryCard
              icon={<MapPinned size={28} />}
              title="Território"
              text="Visualização espacial de dados urbanos, públicos e municipais."
              color="blue"
            />

            <SummaryCard
              icon={<Layers size={28} />}
              title="Camadas"
              text="Organização temática das informações exibidas no mapa."
              color="amber"
            />

            <SummaryCard
              icon={<Database size={28} />}
              title="Dados"
              text="Integração de informações geográficas em uma plataforma única."
              color="blue"
            />

            <SummaryCard
              icon={<Globe2 size={28} />}
              title="Acesso"
              text="Consulta simples e visual para população, técnicos e gestores."
              color="amber"
            />
          </div>
        </section>

        <section
          className="
            mt-8
            bg-white
            rounded-3xl
            shadow-sm
            border
            border-slate-200
            overflow-hidden
          "
        >
          <SectionHeader
            icon={<Map size={23} />}
            title="Sobre o Sobral em Mapas"
            subtitle="Uma ferramenta para consulta, transparência e gestão territorial."
            color="blue"
          />

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                O Sobral em Mapas é uma plataforma WebGIS criada para facilitar
                o acesso, a visualização e a gestão de informações geográficas
                do município.
              </p>

              <p className="text-slate-600 leading-relaxed">
                Por meio dele, o usuário pode consultar camadas temáticas,
                visualizar dados no mapa, pesquisar locais, entender informações
                territoriais e acessar recursos úteis para análise urbana.
              </p>

              <p className="text-slate-600 leading-relaxed">
                A proposta do sistema é aproximar dados geográficos da
                população, dos gestores e das equipes técnicas, tornando o mapa
                uma ferramenta prática para consulta, transparência, planejamento
                e tomada de decisão.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard
                icon={<Search size={22} />}
                title="Busca"
                text="Localize endereços, bairros e pontos de interesse."
              />

              <FeatureCard
                icon={<Layers size={22} />}
                title="Camadas"
                text="Ative e combine mapas temáticos conforme a necessidade."
              />

              <FeatureCard
                icon={<Ruler size={22} />}
                title="Medição"
                text="Meça distâncias e áreas diretamente no mapa."
              />

              <FeatureCard
                icon={<Printer size={22} />}
                title="Impressão"
                text="Exporte recortes do mapa em diferentes formatos."
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <InfoPanel
            icon={<ShieldCheck size={24} />}
            title="Transparência"
            text="Facilita o acesso público a informações territoriais e urbanas."
          />

          <InfoPanel
            icon={<Compass size={24} />}
            title="Planejamento"
            text="Apoia análises espaciais e decisões relacionadas ao município."
          />

          <InfoPanel
            icon={<Users size={24} />}
            title="Uso público"
            text="Disponibiliza uma navegação simples para diferentes perfis de usuários."
          />
        </section>

        <section
          className="
            mt-8
            rounded-3xl
            bg-gradient-to-br
            from-blue-700
            via-blue-800
            to-blue-950
            text-white
            p-8
            overflow-hidden
            relative
          "
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/10" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wide">
                <Landmark size={16} />
                Prefeitura de Sobral
              </div>

              <h2 className="text-2xl lg:text-3xl font-black mt-3">
                Dados geográficos a serviço da cidade
              </h2>

              <p className="text-blue-100 mt-2 max-w-3xl leading-relaxed">
                O portal reúne ferramentas de visualização, consulta e exportação
                para apoiar a leitura do território municipal.
              </p>
            </div>

            <Link
              to="/"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-amber-400
                text-blue-950
                px-5
                py-3
                font-black
                hover:bg-amber-300
                transition
                shrink-0
              "
            >
              <Map size={18} />
              Acessar mapa
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function HeroMetric({ value, label }) {
  return (
    <div
      className="
        rounded-3xl
        bg-white/10
        border
        border-white/10
        p-5
        backdrop-blur
      "
    >
      <p className="text-3xl font-black">
        {value}
      </p>

      <p className="text-sm text-blue-100 mt-1">
        {label}
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  text,
  color,
}) {
  const colorClasses =
    color === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-700";

  return (
    <div
      className="
        bg-white
        rounded-3xl
        shadow-sm
        border
        border-slate-200
        p-6
      "
    >
      <div
        className={`
          h-14
          w-14
          rounded-2xl
          flex
          items-center
          justify-center
          ${colorClasses}
        `}
      >
        {icon}
      </div>

      <h2 className="font-black text-slate-800 text-xl mt-5">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  color,
}) {
  const colorClasses =
    color === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-blue-50 text-blue-700";

  return (
    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
      <div
        className={`
          h-12
          w-12
          rounded-2xl
          flex
          items-center
          justify-center
          shrink-0
          ${colorClasses}
        `}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="font-black text-slate-800 text-xl">
          {title}
        </h2>

        <p className="text-sm text-slate-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
        {icon}
      </div>

      <h3 className="font-black text-slate-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function InfoPanel({ icon, title, text }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
        {icon}
      </div>

      <h3 className="font-black text-slate-800 text-lg mt-5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
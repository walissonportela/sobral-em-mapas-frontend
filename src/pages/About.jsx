import { createElement, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Database,
  FileImage,
  Globe2,
  Heart,
  Info,
  Layers,
  Map,
  MapPin,
  MapPinned,
  MousePointerClick,
  Palette,
  PencilRuler,
  Printer,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Waypoints,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Layers,
    title: "Explore informações",
    description: "Encontre mapas organizados por temas e combine camadas de interesse.",
  },
  {
    icon: SlidersHorizontal,
    title: "Personalize a leitura",
    description: "Ajuste cores, nomes e símbolos para visualizar melhor cada informação.",
  },
  {
    icon: FileImage,
    title: "Compartilhe resultados",
    description: "Realize medições e exporte recortes cartográficos em imagem ou PDF.",
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Camadas temáticas",
    description: "Ative e combine informações organizadas em categorias e subcategorias.",
  },
  {
    icon: MousePointerClick,
    title: "Consulta de informações",
    description: "Selecione elementos do mapa para conhecer seus detalhes e atributos.",
  },
  {
    icon: Palette,
    accent: true,
    title: "Cores e rótulos",
    description: "Personalize temporariamente as cores e a exibição dos nomes por camada.",
  },
  {
    icon: MapPin,
    title: "Ícones inteligentes",
    description: "Visualize pontos de interesse com símbolos e agrupamentos conforme o zoom.",
  },
  {
    icon: Heart,
    title: "Pesquisa e favoritos",
    description: "Encontre camadas com mais facilidade e mantenha suas favoritas acessíveis.",
  },
  {
    icon: Ruler,
    accent: true,
    title: "Ferramentas de medição",
    description: "Calcule distâncias e áreas diretamente sobre o mapa interativo.",
  },
  {
    icon: Printer,
    title: "Impressão e exportação",
    description: "Selecione uma região e exporte a visualização em PDF ou imagem.",
  },
  {
    icon: PencilRuler,
    title: "Arquivos e desenhos GeoJSON",
    description: "No gerenciamento, cadastre dados vetoriais ou crie camadas por desenho.",
  },
];

const THEMES = [
  "Bairros e distritos",
  "Educação",
  "Saúde",
  "Mobilidade urbana",
  "Esporte e lazer",
  "Infraestrutura",
  "Espaços públicos",
];

const STEPS = [
  {
    number: "01",
    icon: Layers,
    title: "Escolha suas camadas",
    description: "Abra o painel de mapas, navegue pelos temas disponíveis e ative o que deseja conhecer.",
  },
  {
    number: "02",
    icon: Compass,
    title: "Explore Sobral",
    description: "Aproxime, afaste e clique nos elementos para visualizar suas informações.",
  },
  {
    number: "03",
    icon: Palette,
    title: "Personalize e utilize",
    description: "Consulte as legendas, ajuste a aparência e utilize as ferramentas do mapa.",
  },
];

const DATA_FORMATS = [
  {
    icon: Database,
    title: "Arquivos GeoJSON",
    description: "Camadas vetoriais para representar pontos, linhas e áreas no mapa.",
  },
  {
    icon: PencilRuler,
    title: "Geometrias desenhadas",
    description: "Representações criadas com as ferramentas de desenho da plataforma.",
  },
  {
    icon: Waypoints,
    title: "Serviços WMS",
    description: "Integração com serviços cartográficos externos, quando disponíveis.",
  },
];

function IconBox({ icon, inverted = false, accent = false, size = 22 }) {
  return (
    <span
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
        inverted ? "bg-white/15 text-white" : accent ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      {createElement(icon, { size, strokeWidth: 1.9, "aria-hidden": true })}
    </span>
  );
}

function SectionHeading({ eyebrow, title, description, center = false }) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-blue-950 sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-sm leading-7 text-slate-600 sm:text-base ${center ? "mx-auto max-w-2xl" : "max-w-3xl"}`}>
          {description}
        </p>
      )}
    </div>
  );
}

function FeatureCard({ feature }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
      <IconBox icon={feature.icon} accent={feature.accent} />
      <h3 className="mt-5 text-lg font-extrabold text-blue-950">{feature.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{feature.description}</p>
    </article>
  );
}

function StepCard({ step }) {
  return (
    <article className="relative rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-4xl font-black tracking-tight text-blue-200">{step.number}</span>
        <IconBox icon={step.icon} />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-blue-950">{step.title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
    </article>
  );
}

export default function About() {
  const [heroImageError, setHeroImageError] = useState(false);

  return (
    <div className="h-screen overflow-y-auto scroll-smooth bg-[#f5f8ff] text-slate-900">
      {/* Destaque inicial */}
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white">
        {!heroImageError && (
          <img
            src="/images/sobral-hero.png"
            alt="Vista da cidade de Sobral"
            onError={() => setHeroImageError(true)}
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-950/95 via-blue-950/85 to-blue-800/70" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-7 sm:px-8 lg:px-10 lg:pb-28">
          <nav aria-label="Navegação da página Sobre" className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Voltar ao mapa
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/25 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50 backdrop-blur-sm">
              <Globe2 size={16} aria-hidden="true" />
              Plataforma WebGIS
            </span>
          </nav>

          <div className="grid items-center gap-12 pb-2 pt-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(290px,0.8fr)] lg:gap-16 lg:pt-20">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                <MapPinned size={15} aria-hidden="true" />
                Conheça o Sobral em Mapas
              </span>
              <h1 className="mt-7 text-4xl font-black leading-[1.09] tracking-tight sm:text-5xl lg:text-[3.7rem]">
                Descubra Sobral sob uma <span className="text-amber-300">nova perspectiva.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
                Um mapa interativo que reúne informações sobre o município e oferece
                ferramentas para explorar o território com mais clareza, autonomia e praticidade.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-blue-950 shadow-xl shadow-blue-950/20 transition-all hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Map size={19} aria-hidden="true" />
                  Explorar o mapa
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a
                  href="#funcionalidades"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Conhecer os recursos
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-blue-100/25 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-md sm:p-7">
              <div className="flex items-center gap-3 border-b border-white/15 pb-5">
                <IconBox icon={Map} inverted />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-amber-200">Tudo em um só mapa</p>
                  <h2 className="mt-1 text-lg font-extrabold">Explore o que importa</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { icon: Layers, title: "Informações por temas", subtitle: "Camadas organizadas para consulta" },
                  { icon: MapPin, title: "Pontos de interesse", subtitle: "Ícones e detalhes no mapa" },
                  { icon: Palette, title: "Visualização flexível", subtitle: "Cores, símbolos e rótulos ajustáveis" },
                ].map(({ icon, title, subtitle }) => (
                  <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-blue-950/30 p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-amber-200">
                      {createElement(icon, { size: 20, "aria-hidden": true })}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-blue-100">{subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-amber-300/10 px-4 py-3 text-xs font-semibold leading-5 text-amber-100">
                <Sparkles size={17} className="shrink-0" aria-hidden="true" />
                Diferentes informações, uma visão mais completa do território.
              </div>
            </aside>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl space-y-16 px-5 pb-16 sm:px-8 lg:space-y-20 lg:px-10">
        {/* Benefícios em destaque */}
        <section aria-label="Destaques da plataforma" className="relative z-10 -mt-10 grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/5 sm:p-6">
              <IconBox icon={item.icon} />
              <div>
                <h2 className="font-extrabold text-blue-950">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Apresentação e temas */}
        <section aria-labelledby="sobre-plataforma" className="grid gap-7 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[2rem] border border-blue-100 bg-white p-7 shadow-sm sm:p-9 lg:p-10">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.17em] text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Sobre a plataforma
            </span>
            <h2 id="sobre-plataforma" className="mt-4 max-w-xl text-2xl font-black leading-tight tracking-tight text-blue-950 sm:text-3xl">
              Uma forma mais simples de conhecer o território de Sobral.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-8 text-slate-600 sm:text-base">
              <p>
                O <strong className="font-extrabold text-blue-900">Sobral em Mapas</strong> é uma plataforma
                WebGIS que organiza e apresenta informações geográficas de interesse municipal em
                um ambiente acessível pelo navegador.
              </p>
              <p>
                Em um único mapa, é possível visualizar diferentes camadas, consultar dados de
                locais e equipamentos, realizar medições e personalizar a apresentação das informações.
                Assim, o território pode ser explorado de forma visual e interativa.
              </p>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              <CheckCircle2 size={18} className="shrink-0 text-blue-600" aria-hidden="true" />
              Consulta e gerenciamento geográfico no mesmo ambiente.
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-100 via-blue-50 to-white p-7 sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border-[32px] border-blue-200/30" />
            <div className="relative">
              <IconBox icon={Waypoints} />
              <h2 className="mt-5 text-xl font-black text-blue-950 sm:text-2xl">Sobral em diferentes camadas</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Navegue pelos assuntos disponíveis e descubra novas formas de interpretar os espaços do município.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {THEMES.map((theme) => (
                  <span key={theme} className="rounded-full border border-blue-200 bg-white/90 px-3.5 py-2 text-xs font-bold text-blue-800 shadow-sm">
                    {theme}
                  </span>
                ))}
              </div>
              <div className="mt-7 border-t border-blue-200/80 pt-5 text-xs leading-6 text-blue-700/80">
                Os temas exibidos dependem das camadas cadastradas e disponibilizadas no mapa.
              </div>
            </div>
          </aside>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" aria-labelledby="titulo-funcionalidades" className="scroll-mt-8">
          <SectionHeading
            eyebrow="Funcionalidades"
            title="Mais possibilidades em cada mapa"
            description="Ferramentas para consultar, visualizar, organizar e compartilhar informações geoespaciais de maneira intuitiva."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </section>

        {/* Visualização personalizada */}
        <section aria-labelledby="visualizacao-titulo" className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 p-7 text-white shadow-xl shadow-blue-950/10 sm:p-9 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-sky-300/10 blur-2xl" />
          <div className="relative grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200">Visualização inteligente</span>
              <h2 id="visualizacao-titulo" className="mt-3 max-w-lg text-2xl font-black leading-tight sm:text-3xl">
                O mapa se adapta à maneira como você quer explorar.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-8 text-blue-100 sm:text-base">
                Cada camada pode ser apresentada de um jeito diferente. Combine cores,
                nomes e símbolos para destacar o que realmente importa, sem modificar os dados originais.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-blue-100">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-amber-300" /> Cores por camada</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-amber-300" /> Rótulos adaptativos</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-amber-300" /> Pontos agrupados</span>
              </div>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-4">
                <span className="flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={19} /> Personalização</span>
                <span className="rounded-full bg-amber-300/15 px-3 py-1 text-[11px] font-bold text-amber-200">Por camada</span>
              </div>
              <p className="mt-5 text-xs font-semibold text-blue-100">Cores de visualização</p>
              <div className="mt-3 flex flex-wrap items-center gap-3" aria-label="Exemplos de cores disponíveis">
                {["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f59e0b", "#0891b2"].map((color) => (
                  <span key={color} className="h-9 w-9 rounded-full border-[3px] border-white/80 shadow-lg" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-blue-950/35 p-4">
                  <MapPin size={22} className="text-amber-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold">Ícones e agrupamentos</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100">Mais clareza ao aproximar ou afastar.</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-blue-950/35 p-4">
                  <Palette size={22} className="text-amber-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold">Legendas sincronizadas</p>
                  <p className="mt-1 text-xs leading-5 text-blue-100">Simbologia acompanha suas escolhas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Introdução de uso */}
        <section aria-labelledby="como-utilizar">
          <SectionHeading
            eyebrow="Como utilizar"
            title="Comece a explorar em três passos"
            description="Você não precisa conhecer ferramentas de geoprocessamento para fazer suas primeiras consultas."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => <StepCard key={step.number} step={step} />)}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900">
              <BookOpen size={19} className="shrink-0" aria-hidden="true" />
              Precisa de orientação? O mapa também oferece um tutorial.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 hover:text-blue-900 hover:underline">
              Ir para o mapa <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Fontes e formatos de dados */}
        <section aria-labelledby="dados-titulo" className="grid gap-7 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-amber-50/50 p-7 shadow-sm sm:p-9">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-md shadow-blue-800/10">
              <Database size={23} aria-hidden="true" />
            </div>
            <h2 id="dados-titulo" className="mt-5 text-2xl font-black tracking-tight text-blue-950 sm:text-3xl">
              Diferentes fontes, uma visão integrada de Sobral.
            </h2>
            <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">
              Informações cartográficas podem ser disponibilizadas por arquivos vetoriais,
              desenhos e serviços de mapas. A plataforma reúne essas fontes em camadas
              temáticas para facilitar a visualização e a consulta.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/85 p-4">
              <Info size={20} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
              <p className="text-xs leading-6 text-blue-900/80">
                A cobertura, a precisão e a atualização das informações dependem
                das fontes utilizadas em cada camada.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-1">
            {DATA_FORMATS.map((format, index) => (
              <article key={format.title} className="flex items-start gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 sm:p-6">
                <IconBox icon={format.icon} accent={index === 1} />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-blue-950">{format.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{format.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Convite final */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-800 to-blue-950 p-8 text-white shadow-xl shadow-blue-950/10 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border-[35px] border-amber-300/15" />
          <div className="relative flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-200">
                <MapPinned size={17} aria-hidden="true" />
                Continue explorando
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Sobral está a poucos cliques de você.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                Explore mapas, descubra informações e escolha como visualizar o município.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-extrabold text-blue-950 shadow-lg transition-colors hover:bg-amber-300"
            >
              <Map size={19} aria-hidden="true" />
              Acessar o mapa
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-100 bg-white px-5 py-7">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm sm:px-3">
          <div className="flex items-center gap-3 text-blue-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-amber-300">
              <Map size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold">Sobral em Mapas</p>
              <p className="text-xs text-slate-500">Informações geográficas ao seu alcance.</p>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao mapa
          </Link>
        </div>
      </footer>
    </div>
  );
}

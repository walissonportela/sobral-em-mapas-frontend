import AdminLayout from "../../components/admin/AdminLayout";
import { Layers as LayersIcon } from "lucide-react";

export default function Layers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            Camadas
          </h1>

          <p className="text-slate-500 mt-1">
            Gerencie as camadas geográficas exibidas no mapa.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
            <LayersIcon size={30} />
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Módulo de camadas
          </h2>

          <p className="text-slate-500 mt-2">
            Aqui ficará o CRUD de camadas, incluindo nome, descrição,
            visibilidade pública, ordem e integração com WMS.
          </p>

          <span className="inline-flex mt-5 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
            Em breve
          </span>
        </div>
      </div>
    </AdminLayout>
  );
}
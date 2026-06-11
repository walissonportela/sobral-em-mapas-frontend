// src/components/admin/AdminLayout.jsx
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 flex">
      <AdminSidebar />

      <div className="flex-1 h-screen overflow-hidden flex flex-col">
        <AdminTopbar />

        <main
          className="
            flex-1
            overflow-y-auto
            p-6
            lg:p-8
            scroll-smooth
          "
        >
          <div className="pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">Mapa de Sobral</h1>
          <p className="text-gray-500 mt-4">O mapa será renderizado neste espaço.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
import { GeoJSON } from 'react-leaflet';

export default function CityBoundary({ data }) {
  // Definindo o estilo "Wall" imponente para o limite
  const boundaryStyle = {
    color: "#ef4444", // Vermelho vibrante
    weight: 3,        // Espessura da linha
    fillColor: "#ef4444", 
    fillOpacity: 0.1, // Preenchimento leve para não cobrir o mapa
    dashArray: '5, 10' // Linha tracejada (opcional, estilo profissional)
  };

  return (
    <GeoJSON 
      data={data} 
      style={boundaryStyle} 
      interactive={false} // Para não atrapalhar seus cliques de medição
    />
  );
}
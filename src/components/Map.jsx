import { MapContainer, TileLayer, FeatureGroup, GeoJSON, WMSTileLayer } from 'react-leaflet'; // Adicionei WMSTileLayer
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import MapToolbar from './MapToolBar';
import { useRef, useState, useEffect } from 'react';
import 'leaflet-geometryutil'; 

// 1. ADICIONE { activeLayers } NAS PROPS AQUI!
export default function Map({ activeLayers = [] }) {
  const [map, setMap] = useState(null);
  const [sobralGeoJson, setSobralGeoJson] = useState(null);
  const drawRef = useRef(null);
  const position = [-3.6892, -40.3489];

  const boundaryStyle = {
    color: "#FF0000",
    weight: 3,
    fillColor: "transparent",
    interactive: false
  };

  useEffect(() => {
    const geojsonUrl = "https://polygons.openstreetmap.fr/get_geojson.py?id=302610&params=0";
    fetch(geojsonUrl)
      .then(res => res.json())
      .then(data => setSobralGeoJson(data))
      .catch(err => console.error("Erro ao carregar o polígono de Sobral:", err));
  }, []);

  const onCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polyline') {
      const distance = L.GeometryUtil.accumulatedLengths(layer.getLatLngs()).pop();
      const label = distance > 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} m`;
      layer.bindTooltip(label, { permanent: true, direction: 'top', className: 'measure-label' }).openTooltip();
    }
    if (layerType === 'polygon') {
      const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
      const label = L.GeometryUtil.readableArea(area, true);
      layer.bindTooltip(label, { permanent: true, direction: 'center', className: 'measure-label' }).openTooltip();
    }
    drawRef.current.addLayer(layer);
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapToolbar 
        onZoomIn={() => map?.zoomIn()} 
        onZoomOut={() => map?.zoomOut()}
        onClear={() => drawRef.current?.clearLayers()}
        onMeasureLine={() => new L.Draw.Polyline(map, { shapeOptions: { color: '#2563eb' } }).enable()}
        onMeasureArea={() => new L.Draw.Polygon(map, { shapeOptions: { color: '#2563eb' } }).enable()}
        onStop={() => map?.fire('draw:drawstop')} 
      />
      
      <MapContainer 
        center={position} 
        zoom={14} 
        className="h-full w-full"
        zoomControl={false}
        ref={setMap}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 2. LOGICA PARA DESENHAR AS CAMADAS DA SIDEBAR */}
        {activeLayers.map((layerName) => (
          <WMSTileLayer
            key={layerName}
            // Importante: Porta 8080 do seu Docker
            url="http://localhost:8080/api/proxy-wms" 
            params={{
              layers: layerName,      // Nome técnico vindo do banco (ex: lin_transol_01)
              format: 'image/png',
              transparent: true,      // Para não cobrir o mapa de baixo
              version: '1.1.1'
            }}
            zIndex={100} // Fica acima do mapa base
          />
        ))}

        {sobralGeoJson && <GeoJSON data={sobralGeoJson} style={boundaryStyle} />}

        <FeatureGroup ref={drawRef}>
          <EditControl
            position="topright"
            onCreated={onCreated}
            draw={{ polyline: false, polygon: false, rectangle: false, circle: false, marker: false, circlemarker: false }}
            edit={{ remove: false, edit: false }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
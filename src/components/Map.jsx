import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  GeoJSON,
  WMSTileLayer,
} from "react-leaflet";

import { EditControl } from "react-leaflet-draw";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";

import { useEffect, useRef, useState } from "react";

import MapToolbar from "./MapToolBar";

export default function Map({
  activeLayers = [],
  searchLocation,
}) {
  const [map, setMap] = useState(null);
  const [sobralGeoJson, setSobralGeoJson] =
    useState(null);

  const drawRef = useRef(null);

  const position = [
    -3.6892,
    -40.3489,
  ];

  useEffect(() => {
    fetch(
      "https://polygons.openstreetmap.fr/get_geojson.py?id=302610&params=0"
    )
      .then((res) => res.json())
      .then((data) =>
        setSobralGeoJson(data)
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (
      map &&
      searchLocation
    ) {
      map.flyTo(
        [
          searchLocation.lat,
          searchLocation.lon,
        ],
        17,
        {
          duration: 2,
        }
      );
    }
  }, [searchLocation, map]);

  const onCreated = (e) => {
    const { layerType, layer } = e;

    if (layerType === "polyline") {
      const distance =
        L.GeometryUtil.accumulatedLengths(
          layer.getLatLngs()
        ).pop();

      const text =
        distance > 1000
          ? `${(
              distance / 1000
            ).toFixed(2)} km`
          : `${Math.round(
              distance
            )} m`;

      layer.bindTooltip(text, {
        permanent: true,
      });
    }

    if (layerType === "polygon") {
      const area =
        L.GeometryUtil.geodesicArea(
          layer.getLatLngs()[0]
        );

      layer.bindTooltip(
        L.GeometryUtil.readableArea(
          area,
          true
        ),
        {
          permanent: true,
        }
      );
    }

    drawRef.current.addLayer(layer);
  };

  return (
    <div className="absolute inset-0">
      <MapToolbar
        onZoomIn={() =>
          map?.zoomIn()
        }
        onZoomOut={() =>
          map?.zoomOut()
        }
        onClear={() =>
          drawRef.current?.clearLayers()
        }
        onMeasureLine={() =>
          new L.Draw.Polyline(
            map
          ).enable()
        }
        onMeasureArea={() =>
          new L.Draw.Polygon(
            map
          ).enable()
        }
      />

      <MapContainer
        center={position}
        zoom={14}
        zoomControl={false}
        className="h-full w-full"
        ref={setMap}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {activeLayers.map((layer) => (
          <WMSTileLayer
            key={layer.id}
            url="http://localhost:8080/api/proxy-wms"
            params={{
              layers:
                layer.layer_name,
              transparent: true,
              format: "image/png",
              version: "1.1.1",
            }}
          />
        ))}

        {sobralGeoJson && (
          <GeoJSON
            data={sobralGeoJson}
            style={{
              color: "#ff0000",
              weight: 3,
              fillOpacity: 0,
            }}
          />
        )}

        <FeatureGroup ref={drawRef}>
          <EditControl
            position="topright"
            onCreated={onCreated}
            draw={{
              polyline: false,
              polygon: false,
              rectangle: false,
              circle: false,
              marker: false,
              circlemarker: false,
            }}
            edit={{
              remove: false,
              edit: false,
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
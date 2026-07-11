import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  GeoJSON,
  WMSTileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "leaflet-geometryutil";

import { useEffect, useRef, useState } from "react";

export default function Map({
  activeLayers = [],
  searchLocation,
  mapToolsRef,
}) {
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

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={position}
        zoom={14}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapToolsBridge
          searchLocation={searchLocation}
          mapToolsRef={mapToolsRef}
          drawRef={drawRef}
        />

        <MapZoomControls />

        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {activeLayers.map((layer) => {
          const wmsLink =
            layer.wms_link ||
            layer.wmsLink ||
            null;

          return (
            <WMSTileLayer
              key={layer.id}
              url="http://localhost:8080/api/proxy-wms"
              params={{
                layers: layer.layer_name,
                transparent: true,
                format: "image/png",
                version:
                  wmsLink?.version ||
                  "1.1.1",
                wms_link_id:
                  layer.wms_link_id ||
                  wmsLink?.id ||
                  "",
              }}
            />
          );
        })}

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

        <FeatureGroup ref={drawRef} />
      </MapContainer>
    </div>
  );
}

function MapToolsBridge({
  searchLocation,
  mapToolsRef,
  drawRef,
}) {
  const map = useMap();

  useEffect(() => {
    if (!searchLocation) return;

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
  }, [searchLocation, map]);

  useEffect(() => {
    if (!map) return;

    const handleCreated = (event) => {
      const { layerType, layer } = event;

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
            : `${Math.round(distance)} m`;

        layer.bindTooltip(text, {
          permanent: true,
          direction: "center",
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
            direction: "center",
          }
        );
      }

      drawRef.current?.addLayer(layer);
    };

    map.on(
      L.Draw.Event.CREATED,
      handleCreated
    );

    return () => {
      map.off(
        L.Draw.Event.CREATED,
        handleCreated
      );
    };
  }, [map, drawRef]);

  useEffect(() => {
    if (!mapToolsRef) return;

    mapToolsRef.current = {
      zoomIn: () => {
        map.zoomIn();
      },

      zoomOut: () => {
        map.zoomOut();
      },

      clearDrawings: () => {
        drawRef.current?.clearLayers();
      },

      measureLine: () => {
        const drawer = new L.Draw.Polyline(map, {
          shapeOptions: {
            color: "#2563eb",
            weight: 4,
          },
        });

        drawer.enable();
      },

      measureArea: () => {
        const drawer = new L.Draw.Polygon(map, {
          shapeOptions: {
            color: "#2563eb",
            weight: 3,
            fillOpacity: 0.15,
          },
        });

        drawer.enable();
      },
    };

    return () => {
      mapToolsRef.current = null;
    };
  }, [map, mapToolsRef, drawRef]);

  return null;
}

function MapZoomControls() {
  const map = useMap();

  const handleZoomIn = (event) => {
    event.stopPropagation();
    map.zoomIn();
  };

  const handleZoomOut = (event) => {
    event.stopPropagation();
    map.zoomOut();
  };

  return (
    <div
      data-tour="map-zoom-controls"
      className="
        absolute
        top-4
        right-4
        z-[1000]
        flex
        flex-col
        rounded-2xl
        overflow-hidden
        shadow-xl
        border
        border-slate-200
        bg-white
      "
      onMouseDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleZoomIn}
        className="
          h-11
          w-11
          flex
          items-center
          justify-center
          text-xl
          font-black
          text-slate-700
          hover:bg-blue-50
          hover:text-blue-700
          transition
          border-b
          border-slate-200
        "
        title="Aumentar zoom"
      >
        +
      </button>

      <button
        type="button"
        onClick={handleZoomOut}
        className="
          h-11
          w-11
          flex
          items-center
          justify-center
          text-2xl
          font-black
          text-slate-700
          hover:bg-blue-50
          hover:text-blue-700
          transition
        "
        title="Diminuir zoom"
      >
        −
      </button>
    </div>
  );
}
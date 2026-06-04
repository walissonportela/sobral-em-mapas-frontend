import { useState, useCallback } from 'react';
import Draw from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import Overlay from 'ol/Overlay';

export function useMapTools(mapInstance) {
  const [activeTool, setActiveTool] = useState(null); // 'LineString' ou 'Polygon'

  const stopDrawing = useCallback(() => {
    if (!mapInstance) return;
    
    const draws = mapInstance.getInteractions().getArray()
      .filter(interaction => interaction instanceof Draw);
    draws.forEach(d => mapInstance.removeInteraction(d));
    
    setActiveTool(null);
  }, [mapInstance]);

  const startMeasure = useCallback((type) => {
    if (!mapInstance) return;
    stopDrawing();
    setActiveTool(type);

    const source = new VectorSource();
    const vector = new VectorLayer({
      source: source,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 204, 51, 0.2)' }),
        stroke: new Stroke({ color: '#ffcc33', width: 2 }),
        image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ffcc33' }) })
      })
    });
    mapInstance.addLayer(vector);

    const draw = new Draw({ source, type });
    mapInstance.addInteraction(draw);

    draw.on('drawstart', (evt) => {
      // Aqui podemos implementar o tooltip de medida igual ao seu original
      const sketch = evt.feature;
      sketch.getGeometry().on('change', (e) => {
        const geom = e.target;
        let output = geom instanceof Draw ? getArea(geom) : getLength(geom);
        // console.log("Medida:", output); 
      });
    });

  }, [mapInstance, stopDrawing]);

  return { activeTool, startMeasure, stopDrawing };
}
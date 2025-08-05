import React, { useState, useCallback } from 'react';
import { Map, Source, Layer, AttributionControl } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';

// Map style configuration
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'gsi-pale': {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>',
    }
  },
  layers: [{
    id: 'gsi-pale',
    type: 'raster',
    source: 'gsi-pale',
  }]
};

interface ThinningMapProps {
  geoJsonData: FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }>;
}

export const ThinningMap: React.FC<ThinningMapProps> = ({ geoJsonData }) => {
  const [viewState, setViewState] = useState(() => {
    // Calculate initial bounds from GeoJSON data
    if (geoJsonData && geoJsonData.features.length > 0) {
      let minLng = Infinity, maxLng = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;

      geoJsonData.features.forEach((feature) => {
        feature.geometry.coordinates.forEach((coord) => {
          const [lng, lat] = coord;
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });
      });

      if (isFinite(minLng) && isFinite(maxLng) && isFinite(minLat) && isFinite(maxLat)) {
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;

        // Calculate appropriate zoom level
        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);

        let zoom = 10;
        if (maxDiff < 0.01) zoom = 15;
        else if (maxDiff < 0.1) zoom = 12;
        else if (maxDiff < 1) zoom = 9;
        else zoom = 7;

        return {
          longitude: centerLng,
          latitude: centerLat,
          zoom
        };
      }
    }

    // Default view (Tokyo)
    return {
      longitude: 139.7671,
      latitude: 35.6812,
      zoom: 10
    };
  });

  const handleMapError = useCallback((event: { error: Error }) => {
    console.error('Map error:', event.error);
  }, []);

  // Line layer style
  const lineLayer = {
    id: 'gpx-line',
    type: 'line' as const,
    paint: {
      'line-color': '#2196f3',
      'line-width': 3,
      'line-opacity': 0.8
    }
  };

  // Point layer style for start/end points
  const pointLayer = {
    id: 'gpx-points',
    type: 'circle' as const,
    paint: {
      'circle-radius': 6,
      'circle-color': '#f44336',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2
    }
  };

  // Create point features for start and end points
  const createPointFeatures = (geoJson: FeatureCollection<LineString>): FeatureCollection => {
    const points: Array<{
      type: 'Feature';
      geometry: {
        type: 'Point';
        coordinates: [number, number];
      };
      properties: {
        type: string;
        trackIndex: number;
      };
    }> = [];

    geoJson.features.forEach((feature, index) => {
      const coordinates = feature.geometry.coordinates;
      if (coordinates.length > 0) {
        // Start point
        points.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinates[0] as [number, number]
          },
          properties: {
            type: 'start',
            trackIndex: index
          }
        });

        // End point
        if (coordinates.length > 1) {
          points.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates[coordinates.length - 1] as [number, number]
            },
            properties: {
              type: 'end',
              trackIndex: index
            }
          });
        }
      }
    });

    return {
      type: 'FeatureCollection' as const,
      features: points
    };
  };

  const pointFeatures = createPointFeatures(geoJsonData);

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      onError={handleMapError}
      interactiveLayerIds={[]} // Disable interaction with layers
    >
      <AttributionControl />

      {/* GPX Line Source and Layer */}
      <Source id="gpx-data" type="geojson" data={geoJsonData}>
        <Layer {...lineLayer} />
      </Source>

      {/* Start/End Points Source and Layer */}
      <Source id="gpx-points" type="geojson" data={pointFeatures}>
        <Layer {...pointLayer} />
      </Source>
    </Map>
  );
};

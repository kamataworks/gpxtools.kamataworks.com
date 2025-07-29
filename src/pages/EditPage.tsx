import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { LayerProps, ErrorEvent as MaplibreErrorEvent } from 'react-map-gl/maplibre';
import { loadGPXData } from '../utils/gpxStorage';
import { convertGPXToGeoJSON, convertGeoJSONToGPX } from '../utils/geoJsonConverter';
import type { GPXFile } from '../types/gpx';
import type { FeatureCollection } from 'geojson';

import { Map, AttributionControl } from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw'

import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css'
import type { MapLibreEvent } from 'maplibre-gl';



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

// Layer style for GPX tracks
const trackLayerStyle: LayerProps = {
  id: 'gpx-tracks',
  type: 'line',
  paint: {
    'line-color': '#2563eb',
    'line-width': 3,
    'line-opacity': 0.8
  }
};

export const EditPage: React.FC = () => {
  const navigate = useNavigate();

  const [gpxFiles, setGpxFiles] = useState<GPXFile[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 139.7671,
    latitude: 35.6812,
    zoom: 10
  });

  const handleBackToHome = () => {
    navigate('/');
  };

  const [draw, setDraw] = useState<MaplibreTerradrawControl | null>(null)

  const handleTerradrawOnLoad = useCallback((e: MapLibreEvent) => {
    const maplibreTerradrawControl = new MaplibreTerradrawControl({
      modes: ['render', 'linestring', 'select', 'delete-selection'],
      open: true,
    })
    setDraw(maplibreTerradrawControl)
    e.target.addControl(maplibreTerradrawControl, 'top-left')
  }, [])

  const handleTerradrawOnRemove = useCallback((e: MapLibreEvent) => {
    if(draw) {
      e.target.removeControl(draw)
      setDraw(null)
    }
  }, [draw])

  // Load GPX data from localStorage
  useEffect(() => {
    try {
      const storedFiles = loadGPXData();
      if (storedFiles && storedFiles.length > 0) {
        setGpxFiles(storedFiles);
        const geoJson = convertGPXToGeoJSON(storedFiles);
        setGeoJsonData(geoJson);

        // Calculate bounds for initial view
        if (geoJson.features.length > 0) {
          let minLng = Infinity, maxLng = -Infinity;
          let minLat = Infinity, maxLat = -Infinity;

          geoJson.features.forEach(feature => {
            feature.geometry.coordinates.forEach(([lng, lat]) => {
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

            setViewState({
              longitude: centerLng,
              latitude: centerLat,
              zoom
            });
          }
        }
      } else {
        setError('編集するGPXファイルがありません。ホーム画面でファイルを読み込んでください。');
      }
    } catch (err) {
      console.error('Failed to load GPX data:', err);
      setError('GPXデータの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // draw と GeoJSON の結びつけ
  useEffect(() => {
    if(draw && geoJsonData) {
      // TODO: どうもレンダーされない
      draw.getTerraDrawInstance().addFeatures(geoJsonData.features.map(f => ({...f, properties: { ...f.properties, mode: 'linestring' }})))
    }
  }, [draw, geoJsonData])

  const handleDownload = useCallback(() => {
    if (!geoJsonData) return;

    try {
      const gpxContent = convertGeoJSONToGPX(geoJsonData);
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-tracks.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('ファイルのダウンロードに失敗しました');
    }
  }, [geoJsonData]);

  const handleMapError = useCallback((event: MaplibreErrorEvent) => {
    console.error('Map error:', event);
    setError('マップの読み込み中にエラーが発生しました');
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">マップを読み込み中...</Typography>
        <Typography variant="body2" color="text.secondary">
          初回読み込み時は少し時間がかかる場合があります
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToHome}
            sx={{ mb: 2 }}
          >
            ホームに戻る
          </Button>
        </Box>

        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="body1">{error}</Typography>
        </Alert>

        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>
              エラーが発生しました
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              ホーム画面に戻ってGPXファイルを読み込み直してください。
            </Typography>
            <Button
              variant="contained"
              onClick={handleBackToHome}
              size="large"
            >
              ホームに戻る
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToHome}
          sx={{ mb: 1 }}
        >
          ホームに戻る
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          GPX編集
        </Typography>
        <Typography variant="body1" color="text.secondary">
          地図上でGPXトラックを編集できます。左上のツールを使って線を選択・編集・削除してください。
        </Typography>
      </Box>

      <Card sx={{ height: '70vh', position: 'relative', overflow: 'hidden' }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          onError={handleMapError}
          onLoad={handleTerradrawOnLoad}
          onRemove={handleTerradrawOnRemove}
        >
          {/* {geoJsonData && geoJsonData.features.length > 0 && (
            <Source id="gpx-data" type="geojson" data={geoJsonData}>
              <Layer {...trackLayerStyle} />
            </Source>
          )} */}

          <AttributionControl />

        </Map>

        {geoJsonData && geoJsonData.features.length > 0 && (
          <Fab
            color="primary"
            aria-label="download"
            onClick={handleDownload}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
            }}
          >
            <Download />
          </Fab>
        )}
      </Card>

      {gpxFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            読み込み済みファイル: {gpxFiles.map(f => f.name).join(', ')}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

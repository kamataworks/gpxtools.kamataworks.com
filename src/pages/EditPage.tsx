import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Fab,
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { ErrorEvent as MaplibreErrorEvent } from 'react-map-gl/maplibre';
import { loadGeoJSONData } from '../utils/gpxStorage';
import { convertGeoJSONToGPX } from '../utils/geoJsonConverter';
import type { FeatureCollection, LineString } from 'geojson';
import { ThinningControls, type ThinningOptions } from '../components/ThinningControls';
import { thinBySequence, thinByTime, thinByDistance } from '../utils/trackThinning';

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

export const EditPage: React.FC = () => {
  const navigate = useNavigate();

  const [originalGeoJsonData, setOriginalGeoJsonData] = useState<FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 139.7671,
    latitude: 35.6812,
    zoom: 10
  });
  const [thinningOptions, setThinningOptions] = useState<ThinningOptions>({
    type: 'none',
    value: null
  });

  const handleBackToHome = () => {
    navigate('/');
  };

  const [draw, setDraw] = useState<MaplibreTerradrawControl | null>(null)

  const handleTerradrawOnLoad = useCallback((e: MapLibreEvent) => {
    const draw = new MaplibreTerradrawControl({
      modes: ['render', 'linestring', 'select', 'delete-selection'],
      open: true,
    })
    e.target.addControl(draw, 'top-left')
    setDraw(draw)

    try {
      const geoJson = loadGeoJSONData();
      if (geoJson && geoJson.features.length > 0) {
        const typedGeoJson = geoJson as FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }>;
        setOriginalGeoJsonData(typedGeoJson);
        setGeoJsonData(typedGeoJson);

        // Calculate bounds for initial view
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;

        geoJson.features.forEach((feature) => {
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

          setViewState({
            longitude: centerLng,
            latitude: centerLat,
            zoom
          });
        }

        const result = draw.getTerraDrawInstance().addFeatures(geoJson.features as any)
        console.log({result})
      } else {
        setError('編集するGeoJSONデータがありません。ホーム画面でファイルを読み込んでください。');
      }
    } catch (err) {
      console.error('Failed to load GeoJSON data:', err);
      setError('GeoJSONデータの読み込みに失敗しました。');
    }
  }, [])

  const handleTerradrawOnRemove = useCallback((e: MapLibreEvent) => {
    if(draw) {
      e.target.removeControl(draw)
      setDraw(null)
    }
  }, [draw])

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

  // 間引き処理されたGeoJSONデータを計算
  const processedGeoJsonData = useMemo(() => {
    if (!originalGeoJsonData) return null;

    const processedFeatures = originalGeoJsonData.features.map(feature => {
      let coordinates = feature.geometry.coordinates as [number, number][];
      let timeStamps = feature.properties.timeStamps || [];

      // 間引き処理を適用
      if (thinningOptions.type !== 'none' && thinningOptions.value !== null) {
        let result;

        switch (thinningOptions.type) {
          case 'sequence':
            result = thinBySequence(coordinates, timeStamps, thinningOptions.value);
            break;
          case 'time':
            result = thinByTime(coordinates, timeStamps, thinningOptions.value);
            break;
          case 'distance':
            result = thinByDistance(coordinates, timeStamps, thinningOptions.value);
            break;
          default:
            result = { coordinates, timeStamps };
        }

        coordinates = result.coordinates;
        timeStamps = result.timeStamps;
      }

      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates
        },
        properties: {
          ...feature.properties,
          timeStamps
        }
      };
    });

    return {
      ...originalGeoJsonData,
      features: processedFeatures
    };
  }, [originalGeoJsonData, thinningOptions]);

  // 地図データの更新
  React.useEffect(() => {
    if (processedGeoJsonData && draw) {
      try {
        // 既存のフィーチャーをクリア
        const terraDrawInstance = draw.getTerraDrawInstance();
        terraDrawInstance.clear();

        // 新しいフィーチャーを追加
        terraDrawInstance.addFeatures(processedGeoJsonData.features as any);
        setGeoJsonData(processedGeoJsonData);
      } catch (err) {
        console.error('Failed to update map features:', err);
      }
    }
  }, [processedGeoJsonData, draw]);

  const handleThinningOptionsChange = useCallback((newOptions: ThinningOptions) => {
    setThinningOptions(newOptions);
  }, []);

  const handleMapError = useCallback((event: MaplibreErrorEvent) => {
    console.error('Map error:', event);
    setError('マップの読み込み中にエラーが発生しました');
  }, []);

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

      {geoJsonData && geoJsonData.features.length > 0 && (
        <>
          <ThinningControls
            coordinates={geoJsonData.features.length > 0 ? geoJsonData.features[0].geometry.coordinates as [number, number][] : []}
            timeStamps={geoJsonData.features.length > 0 ? geoJsonData.features[0].properties.timeStamps || [] : []}
            options={thinningOptions}
            onOptionsChange={handleThinningOptionsChange}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              編集中のトラック数: {geoJsonData.features.length}
            </Typography>
          </Box>
        </>
      )}
    </Container>
  );
};

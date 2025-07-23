import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { loadGPXData } from '../utils/gpxStorage';
import { convertGPXToGeoJSON, convertGeoJSONToGPX } from '../utils/geoJsonConverter';
import type { GPXFile } from '../types/gpx';
import type { GeoJSONFeatureCollection } from '../utils/geoJsonConverter';

export const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const drawRef = useRef<any>(null);

  const [gpxFiles, setGpxFiles] = useState<GPXFile[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleBackToHome = () => {
    navigate('/');
  };

  // localStorage からGPXデータを読み込み
  useEffect(() => {

    const storedFiles = loadGPXData();
    if (storedFiles && storedFiles.length > 0) {
      setGpxFiles(storedFiles);
      const geoJson = convertGPXToGeoJSON(storedFiles);
      setGeoJsonData(geoJson);
    } else {
      setMapError('編集するGPXファイルがありません。ホーム画面でファイルを読み込んでください。');
      setIsMapLoading(false);
    }
  }, []);

  // Maplibre + Terra Draw の動的読み込みと初期化
  useLayoutEffect(() => {
    if (!geoJsonData) return;

    const loadMaplibre = async (retryCount = 0) => {
      // mapContainer.currentの準備を待つ（最大10回まで）
      if (!mapContainer.current) {
        if (retryCount < 10) {
          console.log(`mapContainer not ready, retrying... (${retryCount + 1}/10)`);
          setTimeout(() => loadMaplibre(retryCount + 1), 100);
        } else {
          console.error('mapContainer initialization failed after 10 retries');
          setMapError('マップコンテナの初期化に失敗しました');
          setIsMapLoading(false);
        }
        return;
      }
      try {
        // 動的にMaplibre GL JSとTerra Drawを読み込み
        const [maplibregl, { MaplibreTerradrawControl }] = await Promise.all([
          import('maplibre-gl'),
          import('@watergis/maplibre-gl-terradraw')
        ]);

        // CSSも動的に読み込み
        await Promise.all([
          import('maplibre-gl/dist/maplibre-gl.css'),
          import('@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css')
        ]);

        // 地理院地図paleのスタイル設定
        const mapStyle = {
          version: 8 as const,
          sources: {
            'gsi-pale': {
              type: 'raster' as const,
              tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
            }
          },
          layers: [{
            id: 'gsi-pale',
            type: 'raster' as const,
            source: 'gsi-pale'
          }]
        };

        // マップ初期化
        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style: mapStyle,
          center: [139.7671, 35.6812], // 東京駅を初期中心点
          zoom: 10
        });

        mapRef.current = map;

        map.on('load', () => {
          // Terra Draw control を追加
          const draw = new MaplibreTerradrawControl({
            modes: ['render', 'linestring', 'select', 'delete-selection', 'delete'],
            open: true,
          });

          map.addControl(draw, 'top-left');
          drawRef.current = draw;

          // 初期GeoJSONデータを追加
          if (geoJsonData.features.length > 0) {
            const terraDrawInstance = draw.getTerraDrawInstance();
            terraDrawInstance.addFeatures(geoJsonData.features);

            // マップを全てのフィーチャーが見えるように調整
            const bounds = new maplibregl.LngLatBounds();
            geoJsonData.features.forEach(feature => {
              feature.geometry.coordinates.forEach(coord => {
                bounds.extend(coord as [number, number]);
              });
            });

            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 50 });
            }
          }

          // 編集イベントのリスナーを設定
          const terraDrawInstance = draw.getTerraDrawInstance();

          terraDrawInstance.on('change', () => {
            // 編集が発生した時の処理
            const features = terraDrawInstance.getSnapshot();
            const updatedGeoJson: GeoJSONFeatureCollection = {
              type: 'FeatureCollection',
              features: features as any
            };
            setGeoJsonData(updatedGeoJson);
          });

          setIsMapLoading(false);
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
          setMapError('マップの初期化中にエラーが発生しました');
          setIsMapLoading(false);
        });

      } catch (error) {
        console.error('Failed to load maplibre:', error);
        setMapError('マップライブラリの読み込みに失敗しました');
        setIsMapLoading(false);
      }
    };

    loadMaplibre();

    // クリーンアップ
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        drawRef.current = null;
      }
    };
  }, [geoJsonData]);

  const handleDownload = () => {
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
    } catch (error) {
      console.error('Download error:', error);
      setMapError('ファイルのダウンロードに失敗しました');
    }
  };

  if (isMapLoading) {
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

  if (mapError) {
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
          <Typography variant="body1">{mapError}</Typography>
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

      <Card sx={{ height: '70vh', position: 'relative' }}>
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '4px'
          }}
        />

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

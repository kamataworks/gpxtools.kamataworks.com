import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
} from '@mui/material';
import { Download, Lightbulb } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import type { ErrorEvent as MaplibreErrorEvent } from 'react-map-gl/maplibre';
import { loadGeoJSONData } from '../utils/gpxStorage';
import { convertGeoJSONToGPX } from '../utils/geoJsonConverter';
import type { FeatureCollection, LineString } from 'geojson';
import { TipsModal } from '../components/TipsModal';

// Helper functions for coordinate distance calculation and time interpolation
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  return Math.sqrt(dLon * dLon + dLat * dLat);
};

const findClosestCoordinateIndex = (targetCoord: [number, number], coordinates: [number, number][]): number => {
  let minDistance = Infinity;
  let closestIndex = 0;

  coordinates.forEach((coord, index) => {
    const distance = calculateDistance(targetCoord, coord);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const interpolateTimeStamps = (
  editedCoords: [number, number][],
  originalCoords: [number, number][],
  originalTimeStamps: (string | null)[]
): (string | null)[] => {
  return editedCoords.map((editedCoord, editedIndex) => {
    const closestIndex = findClosestCoordinateIndex(editedCoord, originalCoords);
    const distance = calculateDistance(editedCoord, originalCoords[closestIndex]);

    // 非常に近い場合（移動していない点）は元の時間をそのまま使用
    if (distance < 0.00001) { // 約1m以内
      return originalTimeStamps[closestIndex];
    }

    // 追加された点の場合は前後の点から内挿
    if (editedIndex > 0 && editedIndex < editedCoords.length - 1) {
      const prevCoord = editedCoords[editedIndex - 1];
      const nextCoord = editedCoords[editedIndex + 1];

      const prevIndex = findClosestCoordinateIndex(prevCoord, originalCoords);
      const nextIndex = findClosestCoordinateIndex(nextCoord, originalCoords);

      const prevTime = originalTimeStamps[prevIndex];
      const nextTime = originalTimeStamps[nextIndex];

      if (prevTime && nextTime && prevIndex !== nextIndex) {
        // 線形内挿で時間を計算
        const prevDate = new Date(prevTime);
        const nextDate = new Date(nextTime);
        const totalDistance = calculateDistance(prevCoord, nextCoord);
        const partialDistance = calculateDistance(prevCoord, editedCoord);
        const ratio = totalDistance > 0 ? partialDistance / totalDistance : 0.5;

        const interpolatedTime = new Date(
          prevDate.getTime() + (nextDate.getTime() - prevDate.getTime()) * ratio
        );
        return interpolatedTime.toISOString();
      }
    }

    // 内挿できない場合は最も近い点の時間を使用
    return originalTimeStamps[closestIndex];
  });
};

import { Map } from 'react-map-gl/maplibre';
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

  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[], fileIndex?: number, trackIndex?: number, segmentIndex?: number }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 139.7671,
    latitude: 35.6812,
    zoom: 10
  });
  const [tipsModalOpen, setTipsModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBreadcrumbNavigate = (path: string) => {
    if (path === '/thinning') {
      setConfirmDialogOpen(true);
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  const handleConfirmBackToThinning = () => {
    setConfirmDialogOpen(false);
    navigate('/thinning');
  };

  const handleCancelBackToThinning = () => {
    setConfirmDialogOpen(false);
  };

  const [draw, setDraw] = useState<MaplibreTerradrawControl | null>(null)

  const handleTerradrawOnLoad = useCallback((e: MapLibreEvent) => {
    const draw = new MaplibreTerradrawControl({
      modes: ['linestring', 'select', 'delete-selection'],
      open: true,
    })
    e.target.addControl(draw, 'top-left')
    setDraw(draw)

    try {
      const geoJson = loadGeoJSONData();
      if (geoJson && geoJson.features.length > 0) {
        const typedGeoJson = geoJson as FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }>;
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

        const drawInstance = draw.getTerraDrawInstance()
        const result = drawInstance.addFeatures(geoJson.features as any)
        console.log(result) // エラーが戻り値から確認できる

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

  const createEditedGeoJSON = useCallback((includeTime: boolean): FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> => {
    if (!draw || !geoJsonData) {
      throw new Error('Draw instance or GeoJSON data not available');
    }

    // Get the current edited features from Terradraw
    const drawInstance = draw.getTerraDrawInstance();
    const currentFeatures = drawInstance.getSnapshot();

    // Define the expected structure of Terradraw features
    interface TerradrawFeature {
      geometry: {
        type: string;
        coordinates: [number, number][];
      };
      properties?: {
        fileIndex?: number;
        trackIndex?: number;
        segmentIndex?: number;
      };
    }

    // Create updated GeoJSON with edited features
    const editedGeoJson: FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> = {
      type: 'FeatureCollection',
      features: (currentFeatures as unknown as TerradrawFeature[])
        // 編集した点データも入っているようなので、フィルタ
        .filter((f) => f.geometry.type === 'LineString')
        .map((feature, index: number) => {
          // Find the original feature to preserve metadata
          // First try to match by properties, then fall back to index-based matching
          let originalFeature = geoJsonData.features.find(f =>
            f.properties.fileIndex === feature.properties?.fileIndex &&
            f.properties.trackIndex === feature.properties?.trackIndex &&
            f.properties.segmentIndex === feature.properties?.segmentIndex
          );

          // Fallback: use index-based matching if properties don't match
          if (!originalFeature && index < geoJsonData.features.length) {
            originalFeature = geoJsonData.features[index];
          }

          // Final fallback: use first feature
          if (!originalFeature) {
            originalFeature = geoJsonData.features[0];
          }

          let adjustedTimeStamps: (string | null)[] | undefined = undefined;

          if (includeTime && originalFeature.properties.timeStamps) {
            const originalCoords = originalFeature.geometry.coordinates as [number, number][];
            const editedCoords = feature.geometry.coordinates as [number, number][];

            // 時間情報を内挿して復元
            adjustedTimeStamps = interpolateTimeStamps(
              editedCoords,
              originalCoords,
              originalFeature.properties.timeStamps
            );
          }

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: feature.geometry.coordinates
            },
            properties: {
              fileName: originalFeature.properties.fileName,
              timeStamps: adjustedTimeStamps
            }
          };
        })
    };

    return editedGeoJson;
  }, [draw, geoJsonData]);

  const handleDownloadWithTime = useCallback(() => {
    try {
      const editedGeoJson = createEditedGeoJSON(true);
      const gpxContent = convertGeoJSONToGPX(editedGeoJson, true);
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-tracks-with-time.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('ファイルのダウンロードに失敗しました');
    }
  }, [createEditedGeoJSON]);

  const handleDownloadWithoutTime = useCallback(() => {
    try {
      const editedGeoJson = createEditedGeoJSON(false);
      const gpxContent = convertGeoJSONToGPX(editedGeoJson, false);
      const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited-tracks-no-time.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('ファイルのダウンロードに失敗しました');
    }
  }, [createEditedGeoJSON]);


  const handleMapError = useCallback((event: MaplibreErrorEvent) => {
    console.error('Map error:', event);
    setError('マップの読み込み中にエラーが発生しました');
  }, []);

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumb />

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
    <Container
      maxWidth="xl"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        py: 1
      }}
    >
      {/* ヘッダーセクション - 固定サイズ */}
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Breadcrumb onNavigate={handleBreadcrumbNavigate} />

        <Typography variant="h4" component="h1" gutterBottom>
          GPX編集
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: 'inline' }}>
          地図上でGPXトラックを編集できます。左上のツールを使って線を選択・編集・削除してください。
        </Typography>
        <Link
          component="button"
          variant="body2"
          onClick={() => setTipsModalOpen(true)}
          sx={{ ml: 1, cursor: 'pointer' }}
        >
          <Lightbulb fontSize="small" />
           ヒント
        </Link>
      </Box>

      {/* マップセクション - 残りの空間を使用 */}
      <Card sx={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        mb: 1
      }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLE}
          onError={handleMapError}
          onLoad={handleTerradrawOnLoad}
          onRemove={handleTerradrawOnRemove}
        >
        </Map>
      </Card>

      {/* フッターセクション - 固定サイズ */}
      {geoJsonData && geoJsonData.features.length > 0 && (
        <Box sx={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          py: 1
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Download />}
            onClick={handleDownloadWithTime}
            size="large"
            sx={{ px: 3, py: 1.5 }}
          >
            編集後のGPXをダウンロード（時間情報付き）
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Download />}
            onClick={handleDownloadWithoutTime}
            size="large"
            sx={{ px: 3, py: 1.5 }}
          >
            編集後のGPXをダウンロード（時間情報なし）
          </Button>
        </Box>
      )}



      {/* 確認ダイアログ */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelBackToThinning}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ padding: '24px 24px 16px' }}>
          間引き設定に戻りますか？
        </DialogTitle>
        <DialogContent sx={{ padding: '0 24px 16px' }}>
          <DialogContentText id="confirm-dialog-description">
            編集内容が失われ、元のデータから間引き設定をやり直すことになります。
            この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px 24px' }}>
          <Button onClick={handleCancelBackToThinning}>
            キャンセル
          </Button>
          <Button onClick={handleConfirmBackToThinning} color="primary" variant="contained">
            間引き設定に戻る
          </Button>
        </DialogActions>
      </Dialog>

      {/* ヒントモーダル */}
      <TipsModal
        open={tipsModalOpen}
        onClose={() => setTipsModalOpen(false)}
        title="編集のヒント"
        tips={[
          'トラックを選択して点を編集します。',
          '中間点を選択すると点を追加可能です。',
          '点をドラッグで移動し、トラックを変形可能です。',
          '点を右クリックで削除することができます。'
        ]}
      />
    </Container>
  );
};

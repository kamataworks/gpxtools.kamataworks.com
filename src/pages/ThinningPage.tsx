import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadOriginalGeoJSONData, saveGeoJSONData } from '../utils/gpxStorage';
import type { FeatureCollection, LineString } from 'geojson';
import { ThinningControls, type ThinningOptions } from '../components/ThinningControls';
import { thinBySequence, thinByTime, thinByDistance } from '../utils/trackThinning';
import { ThinningMap } from '../components/ThinningMap';

export const ThinningPage: React.FC = () => {
  const navigate = useNavigate();

  const [originalGeoJsonData, setOriginalGeoJsonData] = useState<FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinningOptions, setThinningOptions] = useState<ThinningOptions>({
    type: 'none',
    value: null
  });

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleProceedToEdit = () => {
    if (processedGeoJsonData) {
      // 間引き済みデータを保存
      saveGeoJSONData(processedGeoJsonData);
      navigate('/edit');
    }
  };

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

  const handleThinningOptionsChange = useCallback((newOptions: ThinningOptions) => {
    setThinningOptions(newOptions);
  }, []);

  // データの読み込み
  React.useEffect(() => {
    try {
      const geoJson = loadOriginalGeoJSONData();
      if (geoJson && geoJson.features.length > 0) {
        const typedGeoJson = geoJson as FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }>;
        setOriginalGeoJsonData(typedGeoJson);
      } else {
        setError('間引きするGeoJSONデータがありません。ホーム画面でファイルを読み込んでください。');
      }
    } catch (err) {
      console.error('Failed to load GeoJSON data:', err);
      setError('GeoJSONデータの読み込みに失敗しました。');
    }
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
          GPX間引き設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          GPXトラックの間引き設定を行います。設定後、編集ページで詳細な編集が可能です。
        </Typography>
      </Box>

      {/* 地図表示 */}
      <Card sx={{ height: '60vh', position: 'relative', overflow: 'hidden', mb: 2 }}>
        {processedGeoJsonData && (
          <ThinningMap geoJsonData={processedGeoJsonData} />
        )}
      </Card>

      {/* 間引きコントロール */}
      {originalGeoJsonData && originalGeoJsonData.features.length > 0 && (
        <ThinningControls
          coordinates={originalGeoJsonData.features.length > 0 ? originalGeoJsonData.features[0].geometry.coordinates as [number, number][] : []}
          timeStamps={originalGeoJsonData.features.length > 0 ? originalGeoJsonData.features[0].properties.timeStamps || [] : []}
          options={thinningOptions}
          onOptionsChange={handleThinningOptionsChange}
        />
      )}

      {/* 統計情報と次へボタン */}
      {processedGeoJsonData && processedGeoJsonData.features.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: 'primary.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                処理後のトラック数: {processedGeoJsonData.features.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                元データ: {originalGeoJsonData?.features[0]?.geometry.coordinates.length || 0}点 →
                処理後: {processedGeoJsonData.features[0]?.geometry.coordinates.length || 0}点
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleProceedToEdit}
              size="large"
            >
              編集ページへ進む
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

import React, { useState, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { ArrowBack, Edit, Lightbulb } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loadOriginalGeoJSONData, saveGeoJSONData } from '../utils/gpxStorage';
import type { FeatureCollection, LineString } from 'geojson';
import { ThinningControls, type ThinningOptions } from '../components/ThinningControls';
import { ThinningStats } from '../components/ThinningStats';
import { thinBySequence, thinByTime, thinByDistance } from '../utils/trackThinning';
import { ThinningMap } from '../components/ThinningMap';
import { TipsModal } from '../components/TipsModal';

export const ThinningPage: React.FC = () => {
  const navigate = useNavigate();

  const [originalGeoJsonData, setOriginalGeoJsonData] = useState<FeatureCollection<LineString, { fileName: string, timeStamps?: (string | null)[] }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thinningOptions, setThinningOptions] = useState<ThinningOptions>({
    type: 'none',
    value: null
  });
  const [tipsModalOpen, setTipsModalOpen] = useState(false);

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
        <Typography variant="body1" color="text.secondary" sx={{ display: 'inline' }}>
          GPXトラックの間引き設定を行います。設定後、編集ページで詳細な編集が可能です。
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

      {/* レスポンシブレイアウト: PC画面では左右分割、モバイルでは縦並び */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        gap: 2,
        height: { xs: 'auto', lg: 'calc(100vh - 200px)' }
      }}>

        {/* 左サイドバー: 統計情報（固定） + 間引きコントロール（スクロール） */}
        <Box sx={{
          flex: { xs: 'none', lg: '1 1 34%' },
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', lg: '100%' }
        }}>
          {/* 統計情報（固定表示） */}
          {originalGeoJsonData && originalGeoJsonData.features.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <ThinningStats
                coordinates={originalGeoJsonData.features[0].geometry.coordinates as [number, number][]}
                timeStamps={originalGeoJsonData.features[0].properties.timeStamps || []}
                processedPointCount={processedGeoJsonData?.features[0]?.geometry.coordinates.length}
              />
            </Box>
          )}

          {/* 間引きコントロール（スクロール可能） */}
          <Box sx={{
            flex: 1,
            overflow: { xs: 'visible', lg: 'auto' },
            minHeight: 0
          }}>
            {originalGeoJsonData && originalGeoJsonData.features.length > 0 && (
              <ThinningControls
                options={thinningOptions}
                onOptionsChange={handleThinningOptionsChange}
              />
            )}
          </Box>
        </Box>

        {/* 右サイドバー: 地図 + 編集ページへ進むボタン */}
        <Box sx={{
          flex: { xs: 'none', lg: '1 1 66%' },
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', lg: '100%' }
        }}>
          {/* 地図表示 */}
          <Card sx={{
            flex: { xs: 'none', lg: 1 },
            height: { xs: '400px', lg: 'auto' },
            minHeight: { xs: '400px', lg: 0 },
            position: 'relative',
            overflow: 'hidden'
          }}>
            {processedGeoJsonData && (
              <ThinningMap geoJsonData={processedGeoJsonData} />
            )}
          </Card>

          {/* 編集ページへ進むボタン */}
          {processedGeoJsonData && processedGeoJsonData.features.length > 0 && (
            <Box sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleProceedToEdit}
                size="large"
              >
                編集ページへ進む
              </Button>
            </Box>
          )}
        </Box>

      </Box>

      {/* ヒントモーダル */}
      <TipsModal
        open={tipsModalOpen}
        onClose={() => setTipsModalOpen(false)}
        title="間引き設定のヒント"
        tips={[
          'データの間引きを行うことで、編集が容易になり、ファイルサイズを最適化できます。',
          'コンピューターの性能によりますが、目安として200点程度に調整することをお勧めします。'
        ]}
      />
    </Container>
  );
};

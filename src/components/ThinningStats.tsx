import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import {
  calculateTrackStats,
  formatTimeInterval,
  formatDistance,
  type TrackStats
} from '../utils/trackThinning';

interface ThinningStatsProps {
  originalCoordinates: [number, number][];
  originalTimeStamps: (string | null)[];
  processedCoordinates?: [number, number][];
  processedTimeStamps?: (string | null)[];
}

export const ThinningStats: React.FC<ThinningStatsProps> = ({
  originalCoordinates,
  originalTimeStamps,
  processedCoordinates,
  processedTimeStamps
}) => {
  const originalStats: TrackStats = calculateTrackStats(originalCoordinates, originalTimeStamps);
  const processedStats: TrackStats | null = processedCoordinates && processedTimeStamps
    ? calculateTrackStats(processedCoordinates, processedTimeStamps)
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 元データセクション */}
      <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          📊 元データ
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body2">
              <strong>点数:</strong> {originalStats.totalPoints.toLocaleString()}点
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body2">
              <strong>平均時間間隔:</strong> {formatTimeInterval(originalStats.averageTimeInterval)}
            </Typography>
          </Box>
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body2">
              <strong>総距離:</strong> {formatDistance(originalStats.totalDistance)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 間引き後データセクション */}
      {processedStats && (
        <Paper sx={{ p: 2, backgroundColor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ⚡ 間引き後データ
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="body2">
                <strong>点数:</strong> {processedStats.totalPoints.toLocaleString()}点
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="body2">
                <strong>平均時間間隔:</strong> {formatTimeInterval(processedStats.averageTimeInterval)}
              </Typography>
            </Box>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="body2">
                <strong>総距離:</strong> {formatDistance(processedStats.totalDistance)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

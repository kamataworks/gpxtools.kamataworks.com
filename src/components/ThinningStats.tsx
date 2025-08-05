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
  coordinates: [number, number][];
  timeStamps: (string | null)[];
  processedPointCount?: number;
}

export const ThinningStats: React.FC<ThinningStatsProps> = ({
  coordinates,
  timeStamps,
  processedPointCount
}) => {
  const stats: TrackStats = calculateTrackStats(coordinates, timeStamps);

  return (
    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        📊 現在の状態
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 200px' }}>
          <Typography variant="body2">
            <strong>元データ:</strong> {stats.totalPoints.toLocaleString()}点
          </Typography>
        </Box>
        {processedPointCount !== undefined && (
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography variant="body2">
              <strong>間引き後:</strong> {processedPointCount.toLocaleString()}点
            </Typography>
          </Box>
        )}
        <Box sx={{ flex: '1 1 200px' }}>
          <Typography variant="body2">
            <strong>平均時間間隔:</strong> {formatTimeInterval(stats.averageTimeInterval)}
          </Typography>
        </Box>
        <Box sx={{ flex: '1 1 200px' }}>
          <Typography variant="body2">
            <strong>総距離:</strong> {formatDistance(stats.totalDistance)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

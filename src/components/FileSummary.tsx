import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import { InsertDriveFile, Timeline, LocationOn, Close } from '@mui/icons-material';
import type { GPXFileSummary } from '../types/gpx';

interface FileSummaryProps {
  summary: GPXFileSummary;
  onFileDelete: (fileIndex: number) => void;
}

export const FileSummary: React.FC<FileSummaryProps> = ({ summary, onFileDelete }) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '日付不明';
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          読み込み済みファイル
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            icon={<InsertDriveFile />}
            label={`${summary.totalFiles.toLocaleString()} ファイル`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<Timeline />}
            label={`${summary.totalTracks.toLocaleString()} トラック`}
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<LocationOn />}
            label={`${summary.totalPoints.toLocaleString()} ポイント`}
            color="success"
            variant="outlined"
          />
        </Box>

        <List dense>
          {summary.files.map((file, index) => (
            <ListItem
              key={index}
              divider={index < summary.files.length - 1}
              secondaryAction={
                <Tooltip title="ファイルを削除">
                  <IconButton
                    edge="end"
                    onClick={() => onFileDelete(index)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                      },
                    }}
                  >
                    <Close />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemIcon>
                <InsertDriveFile color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" component="span">
                      {file.tracks.length.toLocaleString()} トラック / {file.tracks.flatMap(track => track.segments).flatMap(segment => segment.points).length.toLocaleString()} ポイント
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary" component="span">
                      {formatDate(file.createdAt)}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

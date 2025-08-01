import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { Edit, MergeType } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { saveGeoJSONData } from '../utils/gpxStorage';
import { convertGPXToGeoJSON, convertGPXToMergedGeoJSON, checkTimeRangeOverlaps } from '../utils/geoJsonConverter';
import type { TimeOverlapResult } from '../utils/geoJsonConverter';
import type { GPXFile } from '../types/gpx';

interface EditModeButtonsProps {
  disabled?: boolean;
  gpxFiles: GPXFile[];
}

export const EditModeButtons: React.FC<EditModeButtonsProps> = ({
  disabled = false,
  gpxFiles,
}) => {
  const navigate = useNavigate();
  const [timeOverlapCheck, setTimeOverlapCheck] = useState<TimeOverlapResult | null>(null);
  const [loading, setLoading] = useState(true);

  const totalTracks = useMemo(() => gpxFiles.reduce((sum, file) => sum + file.tracks.length, 0), [gpxFiles]);

  useEffect(() => {
    const checkTimeOverlaps = () => {
      if (gpxFiles && gpxFiles.length > 0) {
        const overlapResult = checkTimeRangeOverlaps(gpxFiles);
        setTimeOverlapCheck(overlapResult);
      } else {
        setTimeOverlapCheck({ hasOverlap: false, overlappingTracks: [] });
      }
      setLoading(false);
    };

    checkTimeOverlaps();
  }, [gpxFiles]);

  const handleSplitEdit = () => {
    if (gpxFiles) {
      const geoJsonData = convertGPXToGeoJSON(gpxFiles);
      saveGeoJSONData(geoJsonData);
    }
    navigate('/edit');
  };

  const handleMergedEdit = () => {
    if (gpxFiles) {
      const mergedGeoJsonData = convertGPXToMergedGeoJSON(gpxFiles);
      saveGeoJSONData(mergedGeoJsonData);
    }
    navigate('/edit');
  };

  const canMerge = !timeOverlapCheck?.hasOverlap && !loading;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          編集モード
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          GPXファイルのトラックを地図上で編集できます
        </Typography>

        {timeOverlapCheck?.hasOverlap && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              複数のトラックで時間レンジが重複しています。結合編集はできません。
            </Typography>
            {timeOverlapCheck.overlappingTracks.map((overlap, index) => (
              <Typography key={index} variant="caption" display="block">
                • {overlap.file1}の{overlap.track1} と {overlap.file2}の{overlap.track2}
                ({overlap.overlapStart.toLocaleString()} - {overlap.overlapEnd.toLocaleString()})
              </Typography>
            ))}
          </Alert>
        )}

        <Stack spacing={2}>

          {totalTracks > 1 ?
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MergeType />}
              onClick={handleMergedEdit}
              disabled={disabled || !canMerge}
              fullWidth
            >
              トラックを結合して編集
            </Button>

            <Button
              variant="outlined"
              color="primary"
              startIcon={<Edit />}
              onClick={handleSplitEdit}
              disabled={disabled}
              fullWidth
            >
              トラックを分割して編集
            </Button>
          </>
          : <Button
              variant="contained"
              color="primary"
              startIcon={<MergeType />}
              onClick={handleMergedEdit}
              disabled={disabled || !canMerge}
              fullWidth
            >
              トラックを編集
            </Button>
          }

        </Stack>
      </CardContent>
    </Card>
  );
};

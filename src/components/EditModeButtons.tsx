import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { CallSplit, MergeType } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EditModeButtonsProps {
  disabled?: boolean;
}

export const EditModeButtons: React.FC<EditModeButtonsProps> = ({
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleSplitTracks = () => {
    navigate('/edit?mode=split');
  };

  const handleMergeTracks = () => {
    navigate('/edit?mode=merge');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          編集モード
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          GPXファイルのトラックを分割または結合して編集できます
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CallSplit />}
            onClick={handleSplitTracks}
            disabled={disabled}
            sx={{ flex: 1, minWidth: 200 }}
          >
            トラックを分割して編集
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<MergeType />}
            onClick={handleMergeTracks}
            disabled={disabled}
            sx={{ flex: 1, minWidth: 200 }}
          >
            トラックを結合して編集
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

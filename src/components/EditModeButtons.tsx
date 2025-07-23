import React from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EditModeButtonsProps {
  disabled?: boolean;
}

export const EditModeButtons: React.FC<EditModeButtonsProps> = ({
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate('/edit');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          編集モード
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          GPXファイルのトラックを地図上で編集できます
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Edit />}
          onClick={handleEdit}
          disabled={disabled}
          fullWidth
        >
          GPXファイルを編集
        </Button>
      </CardContent>
    </Card>
  );
};

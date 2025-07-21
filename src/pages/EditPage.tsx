import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack, Construction } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const EditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const handleBackToHome = () => {
    navigate('/');
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'split':
        return 'トラック分割編集';
      case 'merge':
        return 'トラック結合編集';
      default:
        return '編集モード';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'split':
        return 'GPXファイル内の複数トラックを個別のファイルに分割して編集します。';
      case 'merge':
        return '複数のGPXファイルを1つのファイルに結合して編集します。';
      default:
        return 'GPXファイルの編集を行います。';
    }
  };

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

        <Typography variant="h4" component="h1" gutterBottom>
          {getModeTitle()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {getModeDescription()}
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          現在選択されているモード: <strong>{mode || '不明'}</strong>
        </Typography>
      </Alert>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Construction sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            編集機能は開発中です
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            GPXファイルの編集機能は現在開発中です。<br />
            近日中に実装予定ですので、しばらくお待ちください。
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
};

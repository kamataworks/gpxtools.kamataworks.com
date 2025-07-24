import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { generateContourBackground } from '../utils/contourGenerator';

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ children }) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');

  useEffect(() => {
    // 初回ロード時に等高線背景を生成
    const generateBackground = () => {
      try {
        const url = generateContourBackground();
        setBackgroundUrl(url);
      } catch (error) {
        console.warn('Failed to generate contour background:', error);
        setBackgroundUrl(''); // フォールバック：空文字列（白背景）
      }
    };

    generateBackground();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {children}
    </Box>
  );
};

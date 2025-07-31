import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { generateContourBackground } from '../utils/contourGenerator';

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ children }) => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // 初回ロード時に等高線背景を生成
    const generateBackground = async () => {
      try {
        const url = generateContourBackground();
        setBackgroundUrl(url);
        // 少し遅延を入れてからフェードイン開始
        setTimeout(() => setIsLoaded(true), 50);
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
        position: 'relative',
      }}
    >
      {/* 背景レイヤー */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: backgroundUrl ? `url("${backgroundUrl}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity .5s ease-in-out',
          zIndex: -1,
        }}
      />
      {/* コンテンツレイヤー */}
      {children}
    </Box>
  );
};

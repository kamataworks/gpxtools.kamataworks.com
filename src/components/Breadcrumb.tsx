import React from 'react';
import { Breadcrumbs, Typography, Link as MuiLink, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Home } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  onNavigate?: (path: string) => boolean; // return false to prevent navigation
}

const breadcrumbConfig: Record<string, BreadcrumbItem[]> = {
  '/': [
    { label: 'ホーム', path: '/', icon: <Home fontSize="small" /> }
  ],
  '/thinning': [
    { label: 'ホーム', path: '/', icon: <Home fontSize="small" /> },
    { label: '間引き設定', path: '/thinning' }
  ],
  '/edit': [
    { label: 'ホーム', path: '/', icon: <Home fontSize="small" /> },
    { label: '間引き設定', path: '/thinning' },
    { label: '編集', path: '/edit' }
  ]
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ onNavigate }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const breadcrumbItems = breadcrumbConfig[currentPath] || [];

  if (breadcrumbItems.length <= 1) {
    return null; // ホームページでは表示しない
  }

  const handleClick = (event: React.MouseEvent, path: string) => {
    if (onNavigate && !onNavigate(path)) {
      event.preventDefault();
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          if (isLast) {
            // 現在のページはリンクなしのテキストとして表示
            return (
              <Typography
                key={item.path}
                color="text.primary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {item.icon}
                {item.label}
              </Typography>
            );
          } else {
            // 他のページはクリック可能なリンクとして表示
            return (
              <MuiLink
                key={item.path}
                component={RouterLink}
                to={item.path}
                underline="hover"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                onClick={(event) => handleClick(event, item.path)}
              >
                {item.icon}
                {item.label}
              </MuiLink>
            );
          }
        })}
      </Breadcrumbs>
    </Box>
  );
};

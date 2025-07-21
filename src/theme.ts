import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // blue-600
      dark: '#1e3a8a', // blue-900
    },
    secondary: {
      main: '#4f46e5', // indigo-600
      dark: '#3730a3', // indigo-800
    },
    success: {
      main: '#16a34a', // green-600
    },
    warning: {
      main: '#f59e0b', // amber-500
    },
    info: {
      main: '#0d9488', // teal-600
    },
    background: {
      default: '#f9fafb', // gray-50
      paper: '#ffffff', // white
    },
    text: {
      primary: '#1f2937', // gray-800
      secondary: '#4b5563', // gray-600
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1f2937',
    },
    h6: {
      fontWeight: 500,
      color: '#1f2937',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

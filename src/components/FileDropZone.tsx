import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading?: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  isLoading = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const gpxFiles = acceptedFiles.filter(
        (file) => file.name.toLowerCase().endsWith('.gpx')
      );

      if (gpxFiles.length > 0) {
        onFilesSelected(gpxFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/gpx+xml': ['.gpx'],
      'text/xml': ['.gpx'],
      'application/xml': ['.gpx'],
    },
    multiple: true,
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 6,
        textAlign: 'center',
        cursor: isLoading ? 'default' : 'pointer',
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        backgroundColor: isDragActive ? 'primary.50' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: isLoading ? 'grey.300' : 'primary.main',
          backgroundColor: isLoading ? 'background.paper' : 'primary.50',
        },
      }}
    >
      <input {...getInputProps()} disabled={isLoading} />

      {isLoading ? (
        <Box>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            GPXファイルを解析中...
          </Typography>
        </Box>
      ) : (
        <Box>
          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragActive ? 'primary.main' : 'grey.400',
              mb: 2,
            }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'GPXファイルをドロップしてください'
              : 'GPXファイルをドロップ、またはクリックして選択'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            複数のGPXファイルを同時に選択できます
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { FileDropZone } from '../components/FileDropZone';
import { FileSummary } from '../components/FileSummary';
import { EditModeButtons } from '../components/EditModeButtons';
import { parseGPXFile, sortGPXFilesByDate, getTotalTrackCount } from '../utils/gpxParser';
import { saveGPXData } from '../utils/gpxStorage';
import type { GPXFile, GPXFileSummary } from '../types/gpx';

export const HomePage: React.FC = () => {
  const [gpxFiles, setGpxFiles] = useState<GPXFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsedFiles: GPXFile[] = [];

      for (const file of files) {
        try {
          const gpxFile = await parseGPXFile(file);
          parsedFiles.push(gpxFile);
        } catch (fileError) {
          console.error(`Failed to parse ${file.name}:`, fileError);
          setError(`${file.name} の解析に失敗しました: ${fileError instanceof Error ? fileError.message : '不明なエラー'}`);
        }
      }

      if (parsedFiles.length > 0) {
        const sortedFiles = sortGPXFilesByDate([...gpxFiles, ...parsedFiles]);
        setGpxFiles(sortedFiles);

        // localStorage に保存
        saveGPXData(sortedFiles);
      }
    } catch (error) {
      setError(`ファイルの処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleFileDelete = (fileIndex: number) => {
    const updatedFiles = gpxFiles.filter((_, index) => index !== fileIndex);
    setGpxFiles(updatedFiles);

    // localStorage を更新
    saveGPXData(updatedFiles);
  };

  const summary: GPXFileSummary = {
    totalFiles: gpxFiles.length,
    totalTracks: getTotalTrackCount(gpxFiles),
    files: gpxFiles,
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GPX Tools
        </Typography>
        <Typography variant="body1" color="text.secondary">
          GPXファイルを編集するためのウェブツール
        </Typography>
      </Box>

      <FileDropZone onFilesSelected={handleFilesSelected} isLoading={isLoading} />

      {gpxFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <FileSummary summary={summary} onFileDelete={handleFileDelete} />
          <EditModeButtons disabled={gpxFiles.length === 0} />
        </Box>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

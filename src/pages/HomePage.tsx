import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Code,
  Edit,
  CloudOff,
  MoneyOff,
  Coffee,
  Build,
} from '@mui/icons-material';
import { FileDropZone } from '../components/FileDropZone';
import { FileSummary } from '../components/FileSummary';
import { EditModeButtons } from '../components/EditModeButtons';
import { parseGPXFile, sortGPXFilesByDate, getTotalTrackCount, getTotalPointCount } from '../utils/gpxParser';
import { saveGPXData, saveGeoJSONData } from '../utils/gpxStorage';
import { convertGPXToGeoJSON } from '../utils/geoJsonConverter';
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

        // GPX データを localStorage に保存
        saveGPXData(sortedFiles);

        // GeoJSON データに変換して localStorage に保存
        const geoJsonData = convertGPXToGeoJSON(sortedFiles);
        saveGeoJSONData(geoJsonData);
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

    // GeoJSON データも更新
    if (updatedFiles.length > 0) {
      const geoJsonData = convertGPXToGeoJSON(updatedFiles);
      saveGeoJSONData(geoJsonData);
    }
  };

  const summary: GPXFileSummary = {
    totalFiles: gpxFiles.length,
    totalTracks: getTotalTrackCount(gpxFiles),
    totalPoints: getTotalPointCount(gpxFiles),
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

      <Box sx={{ mt: 4 }}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="usage-info-content"
            id="usage-info-header"
          >
            <Typography variant="h6">ご利用について</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                主な機能
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Edit color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="GPXファイルを容易に編集できます（結合、点の数の間引き、点編集）" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CloudOff color="success" />
                  </ListItemIcon>
                  <ListItemText primary="データはサーバーに送られないため、安全にご利用いただけます" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MoneyOff color="info" />
                  </ListItemIcon>
                  <ListItemText primary="すべての機能を無料でご利用いただけます" />
                </ListItem>
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                オープンソースプロジェクトについて
              </Typography>
              <Typography variant="body2" paragraph>
                このツールは個人が開発・運営するオープンソースプロジェクトです。
                バグ報告、機能追加提案、コード改善などのご協力を歓迎いたします。
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Code color="primary" />
                <Link
                  href="https://github.com/kamataworks/gpxtools.kamataworks.com/issues/new/choose"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  variant="body2"
                >
                  GitHub Issues でご報告・ご提案
                </Link>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                免責事項
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="データの正確性や利用による損害について責任は負いかねます。"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="予告なくサービスを停止する場合があります。" />
                </ListItem>
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                サポート
              </Typography>
              <Typography variant="body2" paragraph>
                このツールが役に立ったと感じていただけましたら、プロジェクトの継続的な開発をサポートしていただけると幸いです。
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Coffee color="primary" />
                  <Link
                    href="https://coff.ee/kamataworks"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="body2"
                  >
                    コーヒーを一杯ごちそうする
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Build color="secondary" />
                  <Link
                    href="https://www.kamataworks.com/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    variant="body2"
                  >
                    企業向けカスタマイズ・受託開発のご相談
                  </Link>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

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

      {/* Footer */}
      <Box
        sx={{
          textAlign: 'center',
          pt: 3,
          mt: 4,
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom>
          制作: <Link
            href="https://www.kamataworks.com"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
          鎌田製作所（カマタワークス）
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Link
            href="https://github.com/kamataworks/gpxtools.kamataworks.com"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
            オープンソースプロジェクト
          </Link>
          {' | '}
          <Link
            href="https://github.com/kamataworks/gpxtools.kamataworks.com/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
            GitHub
          </Link>
          {' | '}
          <Link
            href="https://www.kamataworks.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="inherit"
          >
            企業向けご相談
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

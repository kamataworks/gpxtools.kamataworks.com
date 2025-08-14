import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Paper,
  TextField
} from '@mui/material';
import type { ThinningOptions, CustomInputs } from '../utils/gpxStorage';

interface ThinningControlsProps {
  options: ThinningOptions;
  customInputs: CustomInputs;
  onOptionsChange: (options: ThinningOptions) => void;
  onCustomInputsChange: (customInputs: CustomInputs) => void;
}

const SEQUENCE_OPTIONS = [
  { value: 4, label: '1/4' },
  { value: 16, label: '1/16' },
  { value: 64, label: '1/64' },
  { value: 256, label: '1/256' },
];

const TIME_OPTIONS = [
  { value: 1, label: '1分間隔' },
  { value: 2, label: '2分間隔' },
  { value: 5, label: '5分間隔' },
  { value: 10, label: '10分間隔' },
];

const DISTANCE_OPTIONS = [
  { value: 10, label: '10m間隔' },
  { value: 50, label: '50m間隔' },
  { value: 100, label: '100m間隔' },
  { value: 500, label: '500m間隔' },
];

// パーサー関数
const parseSequenceInput = (input: string): number | null => {
  const match = input.trim().match(/^1\/(\d+)$/);
  if (match) {
    const [, denominator] = match;
    const den = parseInt(denominator);
    if (den > 0) {
      return den;
    }
  }
  return null;
};

const parseTimeInput = (input: string): number | null => {
  const trimmed = input.trim().toLowerCase();
  let totalMinutes = 0;

  // 1h30m, 2h, 30m, 45s, 1m30s などのパターンをマッチ
  const hourMatch = trimmed.match(/(\d+)h/);
  const minuteMatch = trimmed.match(/(\d+)m(?!s)/);
  const secondMatch = trimmed.match(/(\d+)s/);

  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1]) * 60;
  }
  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1]);
  }
  if (secondMatch) {
    totalMinutes += parseInt(secondMatch[1]) / 60;
  }

  // 単純な数値の場合は分として扱う
  if (!hourMatch && !minuteMatch && !secondMatch) {
    const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/);
    if (numMatch) {
      totalMinutes = parseFloat(numMatch[1]);
    }
  }

  return totalMinutes > 0 ? totalMinutes : null;
};

const parseDistanceInput = (input: string): number | null => {
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(m|km|cm|mm)?$/);

  if (match) {
    const [, numStr, unit = 'm'] = match;
    const num = parseFloat(numStr);

    switch (unit) {
      case 'km':
        return num * 1000;
      case 'cm':
        return num / 100;
      case 'mm':
        return num / 1000;
      case 'm':
      default:
        return num;
    }
  }

  return null;
};

export const ThinningControls: React.FC<ThinningControlsProps> = ({
  options,
  customInputs,
  onOptionsChange,
  onCustomInputsChange
}) => {

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value === 'none') {
      onOptionsChange({ type: 'none', value: null });
    } else {
      const [type, valueStr] = value.split('-');

      if (valueStr === 'custom') {
        // カスタム入力の場合は、現在の入力値をパースして適用
        const inputValue = customInputs[type as 'sequence' | 'time' | 'distance'];
        let parsedValue: number | null = null;

        switch (type) {
          case 'sequence':
            parsedValue = parseSequenceInput(inputValue);
            break;
          case 'time':
            parsedValue = parseTimeInput(inputValue);
            break;
          case 'distance':
            parsedValue = parseDistanceInput(inputValue);
            break;
        }

        if (parsedValue !== null) {
          onOptionsChange({
            type: type as 'sequence' | 'time' | 'distance',
            value: parsedValue
          });
        }
      } else {
        onOptionsChange({
          type: type as 'sequence' | 'time' | 'distance',
          value: parseInt(valueStr, 10)
        });
      }
    }
  };

  const handleCustomInputChange = (type: 'sequence' | 'time' | 'distance', value: string) => {
    // カスタム入力値を更新
    const newCustomInputs = { ...customInputs, [type]: value };
    onCustomInputsChange(newCustomInputs);

    let parsedValue: number | null = null;

    switch (type) {
      case 'sequence':
        parsedValue = parseSequenceInput(value);
        break;
      case 'time':
        parsedValue = parseTimeInput(value);
        break;
      case 'distance':
        parsedValue = parseDistanceInput(value);
        break;
    }

    if (parsedValue !== null) {
      onOptionsChange({ type, value: parsedValue });
    }
  };

  const getCurrentValue = () => {
    if (options.type === 'none' || options.value === null) {
      return 'none';
    }

    // 定義済みオプションかチェック
    const predefinedValues = options.type === 'sequence' ? SEQUENCE_OPTIONS.map(o => o.value) :
                           options.type === 'time' ? TIME_OPTIONS.map(o => o.value) :
                           DISTANCE_OPTIONS.map(o => o.value);

    if (predefinedValues.includes(options.value)) {
      return `${options.type}-${options.value}`;
    } else {
      return `${options.type}-custom`;
    }
  };

  const isCustomInputValid = (type: 'sequence' | 'time' | 'distance'): boolean => {
    const value = customInputs[type];
    if (value === '') return true; // 空の場合はエラーにしない

    switch (type) {
      case 'sequence':
        return parseSequenceInput(value) !== null;
      case 'time':
        return parseTimeInput(value) !== null;
      case 'distance':
        return parseDistanceInput(value) !== null;
      default:
        return false;
    }
  };


  return (
    <Box>
      {/* 間引きオプション - 横並び */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          間引きオプション
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* 間引きなしオプション */}
          <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={getCurrentValue()}
                onChange={handleRadioChange}
              >
                <FormControlLabel
                  value="none"
                  control={<Radio />}
                  label="間引きなし"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 2 }}>
          {/* 順番間引きグループ */}
          <Box sx={{ flex: '1 1 300px', minWidth: '250px', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              順番間引き
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              指定した間隔でポイントを選択します。1/4なら4つに1つのポイントを残します。
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={getCurrentValue()}
                onChange={handleRadioChange}
              >
                {SEQUENCE_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={`sequence-${option.value}`}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Radio
                    value="sequence-custom"
                    checked={getCurrentValue() === 'sequence-custom'}
                    onChange={handleRadioChange}
                  />
                  <TextField
                    size="small"
                    placeholder="例: 1/3, 1/5"
                    value={customInputs.sequence}
                    onChange={(e) => handleCustomInputChange('sequence', e.target.value)}
                    sx={{ minWidth: '150px' }}
                    helperText="1/n フォーマット"
                    error={!isCustomInputValid('sequence')}
                  />
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>

          {/* 時間的間引きグループ */}
          <Box sx={{ flex: '1 1 300px', minWidth: '250px', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              時間的間引き
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              指定した時間間隔でポイントを選択します。GPXファイルに時間情報が必要です。
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={getCurrentValue()}
                onChange={handleRadioChange}
              >
                {TIME_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={`time-${option.value}`}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Radio
                    value="time-custom"
                    checked={getCurrentValue() === 'time-custom'}
                    onChange={handleRadioChange}
                  />
                  <TextField
                    size="small"
                    placeholder="例: 1m30s, 2h, 45s"
                    value={customInputs.time}
                    onChange={(e) => handleCustomInputChange('time', e.target.value)}
                    sx={{ minWidth: '150px' }}
                    helperText="時間フォーマット (h/m/s)"
                    error={!isCustomInputValid('time')}
                  />
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>

          {/* 空間的間引きグループ */}
          <Box sx={{ flex: '1 1 300px', minWidth: '250px', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              空間的間引き
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              指定した距離間隔でポイントを選択します。直線距離で計算されます。
            </Typography>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={getCurrentValue()}
                onChange={handleRadioChange}
              >
                {DISTANCE_OPTIONS.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={`distance-${option.value}`}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Radio
                    value="distance-custom"
                    checked={getCurrentValue() === 'distance-custom'}
                    onChange={handleRadioChange}
                  />
                  <TextField
                    size="small"
                    placeholder="例: 1.5km, 500m, 200cm"
                    value={customInputs.distance}
                    onChange={(e) => handleCustomInputChange('distance', e.target.value)}
                    sx={{ minWidth: '150px' }}
                    helperText="距離フォーマット (km/m/cm/mm)"
                    error={!isCustomInputValid('distance')}
                  />
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

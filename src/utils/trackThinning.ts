import { distance, point, length, lineString } from '@turf/turf';

export interface TrackStats {
  totalPoints: number;
  totalDistance: number; // km
  averageTimeInterval: number | null; // milliseconds
}

export interface ThinningResult {
  coordinates: [number, number][];
  timeStamps: (string | null)[];
}

/**
 * 順番間引き - 素数間隔で点を間引く
 */
export const thinBySequence = (
  coordinates: [number, number][],
  timeStamps: (string | null)[],
  interval: number
): ThinningResult => {
  if (coordinates.length <= 2) {
    return { coordinates, timeStamps };
  }

  const result: ThinningResult = {
    coordinates: [coordinates[0]], // 始点は必ず含める
    timeStamps: [timeStamps[0]]
  };

  // 間隔に従って点を選択
  for (let i = interval; i < coordinates.length - 1; i += interval) {
    result.coordinates.push(coordinates[i]);
    result.timeStamps.push(timeStamps[i]);
  }

  // 終点は必ず含める
  result.coordinates.push(coordinates[coordinates.length - 1]);
  result.timeStamps.push(timeStamps[timeStamps.length - 1]);

  return result;
};

/**
 * 時間的間引き - 指定した時間間隔で点を間引く
 */
export const thinByTime = (
  coordinates: [number, number][],
  timeStamps: (string | null)[],
  intervalMinutes: number
): ThinningResult => {
  if (coordinates.length <= 2) {
    return { coordinates, timeStamps };
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  const result: ThinningResult = {
    coordinates: [coordinates[0]], // 始点は必ず含める
    timeStamps: [timeStamps[0]]
  };

  let lastTime: Date | null = timeStamps[0] ? new Date(timeStamps[0]) : null;

  for (let i = 1; i < coordinates.length - 1; i++) {
    const currentTimeStr = timeStamps[i];
    if (!currentTimeStr || !lastTime) {
      continue; // 時間情報がない場合はスキップ
    }

    const currentTime = new Date(currentTimeStr);
    const timeDiff = currentTime.getTime() - lastTime.getTime();

    if (timeDiff >= intervalMs) {
      result.coordinates.push(coordinates[i]);
      result.timeStamps.push(timeStamps[i]);
      lastTime = currentTime;
    }
  }

  // 終点は必ず含める
  result.coordinates.push(coordinates[coordinates.length - 1]);
  result.timeStamps.push(timeStamps[timeStamps.length - 1]);

  return result;
};

/**
 * 空間的間引き - 指定した距離間隔で点を間引く
 */
export const thinByDistance = (
  coordinates: [number, number][],
  timeStamps: (string | null)[],
  distanceMeters: number
): ThinningResult => {
  if (coordinates.length <= 2) {
    return { coordinates, timeStamps };
  }

  const distanceKm = distanceMeters / 1000;
  const result: ThinningResult = {
    coordinates: [coordinates[0]], // 始点は必ず含める
    timeStamps: [timeStamps[0]]
  };

  let lastPoint = point(coordinates[0]);

  for (let i = 1; i < coordinates.length - 1; i++) {
    const currentPoint = point(coordinates[i]);
    const dist = distance(lastPoint, currentPoint, { units: 'kilometers' });

    if (dist >= distanceKm) {
      result.coordinates.push(coordinates[i]);
      result.timeStamps.push(timeStamps[i]);
      lastPoint = currentPoint;
    }
  }

  // 終点は必ず含める
  result.coordinates.push(coordinates[coordinates.length - 1]);
  result.timeStamps.push(timeStamps[timeStamps.length - 1]);

  return result;
};

/**
 * トラックの統計情報を計算
 */
export const calculateTrackStats = (
  coordinates: [number, number][],
  timeStamps: (string | null)[]
): TrackStats => {
  const totalPoints = coordinates.length;

  // 総距離を計算（Turfを使用）
  let totalDistance = 0;
  if (coordinates.length > 1) {
    try {
      totalDistance = length(lineString(coordinates), { units: 'kilometers' });
    } catch (error) {
      console.warn('Distance calculation failed:', error);
      totalDistance = 0;
    }
  }

  // 平均時間間隔を計算
  const validTimes = timeStamps
    .filter((t): t is string => t !== null)
    .map(t => new Date(t))
    .filter(date => !isNaN(date.getTime()));

  let averageTimeInterval: number | null = null;
  if (validTimes.length > 1) {
    const totalTimeMs = validTimes[validTimes.length - 1].getTime() - validTimes[0].getTime();
    averageTimeInterval = totalTimeMs / (validTimes.length - 1);
  }

  return {
    totalPoints,
    totalDistance,
    averageTimeInterval
  };
};

/**
 * 時間間隔を人間が読みやすい形式に変換
 */
export const formatTimeInterval = (intervalMs: number | null): string => {
  if (intervalMs === null) return '不明';

  const seconds = Math.round(intervalMs / 1000);

  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}分`;
  } else {
    const hours = Math.round(seconds / 3600);
    return `${hours}時間`;
  }
};

/**
 * 距離を人間が読みやすい形式に変換
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
};

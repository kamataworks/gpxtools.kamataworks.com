interface ContourLine {
  points: { x: number; y: number }[];
  level: number;
}

// シンプルなノイズ関数（パーリンノイズの簡易版）
function simpleNoise(x: number, y: number, seed: number = 12345): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// 複数オクターブのノイズを重ね合わせ
function fractalNoise(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 0.01;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += simpleNoise(x * frequency, y * frequency, i * 1000) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

// 自然な地形を生成する高度計算関数
function calculateNaturalHeight(x: number, y: number, width: number, height: number): number {
  // 正規化座標（0-1）
  const nx = x / width;
  const ny = y / height;

  // 基本地形（大きなスケール）
  const baseHeight = fractalNoise(x, y, 3) * 60;

  // 中規模の起伏
  const mediumDetail = fractalNoise(x * 2, y * 2, 2) * 25;

  // 細かいディテール
  const fineDetail = fractalNoise(x * 4, y * 4, 2) * 10;

  // 中央に向かって高くなる傾向（山岳地形風）
  const centerX = 0.5;
  const centerY = 0.5;
  const distanceFromCenter = Math.sqrt((nx - centerX) ** 2 + (ny - centerY) ** 2);
  const centralElevation = Math.max(0, (0.7 - distanceFromCenter) * 40);

  // 全体を合成
  const totalHeight = baseHeight + mediumDetail + fineDetail + centralElevation;

  // 0-100の範囲にクランプ
  return Math.max(5, Math.min(95, totalHeight));
}

// 直接高度計算（補間不要）
function interpolateHeight(x: number, y: number): number {
  return calculateNaturalHeight(x, y, 1920, 1080);
}

// マーチングスクエア法で等高線を生成
function generateContourLines(
  width: number,
  height: number,
  levels: number[],
  resolution: number = 20
): ContourLine[] {
  const contourLines: ContourLine[] = [];
  const stepX = width / resolution;
  const stepY = height / resolution;

  for (const level of levels) {
    for (let i = 0; i < resolution - 1; i++) {
      for (let j = 0; j < resolution - 1; j++) {
        const x1 = i * stepX;
        const y1 = j * stepY;
        const x2 = (i + 1) * stepX;
        const y2 = (j + 1) * stepY;

        // 四角形の4つの角の高度を計算
        const h1 = interpolateHeight(x1, y1);
        const h2 = interpolateHeight(x2, y1);
        const h3 = interpolateHeight(x2, y2);
        const h4 = interpolateHeight(x1, y2);

        // マーチングスクエアのケースを判定
        let caseIndex = 0;
        if (h1 >= level) caseIndex |= 1;
        if (h2 >= level) caseIndex |= 2;
        if (h3 >= level) caseIndex |= 4;
        if (h4 >= level) caseIndex |= 8;

        // 線形補間で等高線の点を計算
        const interpolate = (h1: number, h2: number, x1: number, y1: number, x2: number, y2: number) => {
          if (Math.abs(h1 - h2) < 0.001) return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
          const t = (level - h1) / (h2 - h1);
          return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1),
          };
        };

        // マーチングスクエアのケースに応じて線分を生成
        const lineSegments: { x: number; y: number }[][] = [];

        switch (caseIndex) {
          case 1:
          case 14:
            lineSegments.push([
              interpolate(h1, h2, x1, y1, x2, y1),
              interpolate(h1, h4, x1, y1, x1, y2),
            ]);
            break;
          case 2:
          case 13:
            lineSegments.push([
              interpolate(h1, h2, x1, y1, x2, y1),
              interpolate(h2, h3, x2, y1, x2, y2),
            ]);
            break;
          case 3:
          case 12:
            lineSegments.push([
              interpolate(h1, h4, x1, y1, x1, y2),
              interpolate(h2, h3, x2, y1, x2, y2),
            ]);
            break;
          case 4:
          case 11:
            lineSegments.push([
              interpolate(h2, h3, x2, y1, x2, y2),
              interpolate(h3, h4, x2, y2, x1, y2),
            ]);
            break;
          case 5:
            lineSegments.push([
              interpolate(h1, h2, x1, y1, x2, y1),
              interpolate(h3, h4, x2, y2, x1, y2),
            ]);
            lineSegments.push([
              interpolate(h1, h4, x1, y1, x1, y2),
              interpolate(h2, h3, x2, y1, x2, y2),
            ]);
            break;
          case 6:
          case 9:
            lineSegments.push([
              interpolate(h1, h2, x1, y1, x2, y1),
              interpolate(h3, h4, x2, y2, x1, y2),
            ]);
            break;
          case 7:
          case 8:
            lineSegments.push([
              interpolate(h1, h4, x1, y1, x1, y2),
              interpolate(h3, h4, x2, y2, x1, y2),
            ]);
            break;
          case 10:
            lineSegments.push([
              interpolate(h1, h2, x1, y1, x2, y1),
              interpolate(h1, h4, x1, y1, x1, y2),
            ]);
            lineSegments.push([
              interpolate(h2, h3, x2, y1, x2, y2),
              interpolate(h3, h4, x2, y2, x1, y2),
            ]);
            break;
        }

        // 線分を等高線に追加
        for (const segment of lineSegments) {
          contourLines.push({ points: segment, level });
        }
      }
    }
  }

  return contourLines;
}

// 線分を連結して滑らかな等高線を作成
function connectContourLines(contourLines: ContourLine[]): ContourLine[] {
  const connectedLines: ContourLine[] = [];
  const tolerance = 5; // 連結判定の距離閾値

  // レベル別にグループ化
  const linesByLevel = new Map<number, ContourLine[]>();
  for (const line of contourLines) {
    if (!linesByLevel.has(line.level)) {
      linesByLevel.set(line.level, []);
    }
    linesByLevel.get(line.level)!.push(line);
  }

  // 各レベルで線分を連結
  for (const [level, lines] of linesByLevel) {
    const used = new Set<number>();

    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;

      const connectedLine: ContourLine = {
        points: [...lines[i].points],
        level
      };
      used.add(i);

      // 前方向に連結
      let changed = true;
      while (changed) {
        changed = false;
        const lastPoint = connectedLine.points[connectedLine.points.length - 1];

        for (let j = 0; j < lines.length; j++) {
          if (used.has(j)) continue;

          const line = lines[j];
          const firstPoint = line.points[0];
          const lastPointOfLine = line.points[line.points.length - 1];

          // 終点と始点が近い場合
          const distToFirst = Math.sqrt((lastPoint.x - firstPoint.x) ** 2 + (lastPoint.y - firstPoint.y) ** 2);
          const distToLast = Math.sqrt((lastPoint.x - lastPointOfLine.x) ** 2 + (lastPoint.y - lastPointOfLine.y) ** 2);

          if (distToFirst < tolerance) {
            connectedLine.points.push(...line.points.slice(1));
            used.add(j);
            changed = true;
            break;
          } else if (distToLast < tolerance) {
            connectedLine.points.push(...line.points.slice(0, -1).reverse());
            used.add(j);
            changed = true;
            break;
          }
        }
      }

      // 後方向に連結
      changed = true;
      while (changed) {
        changed = false;
        const firstPoint = connectedLine.points[0];

        for (let j = 0; j < lines.length; j++) {
          if (used.has(j)) continue;

          const line = lines[j];
          const lineFirstPoint = line.points[0];
          const lineLastPoint = line.points[line.points.length - 1];

          const distToFirst = Math.sqrt((firstPoint.x - lineFirstPoint.x) ** 2 + (firstPoint.y - lineFirstPoint.y) ** 2);
          const distToLast = Math.sqrt((firstPoint.x - lineLastPoint.x) ** 2 + (firstPoint.y - lineLastPoint.y) ** 2);

          if (distToLast < tolerance) {
            connectedLine.points.unshift(...line.points.slice(0, -1));
            used.add(j);
            changed = true;
            break;
          } else if (distToFirst < tolerance) {
            connectedLine.points.unshift(...line.points.slice(1).reverse());
            used.add(j);
            changed = true;
            break;
          }
        }
      }

      connectedLines.push(connectedLine);
    }
  }

  return connectedLines;
}

// Catmull-Rom スプライン補間で滑らかな曲線を生成
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${points[1].x.toFixed(2)} ${points[1].y.toFixed(2)}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  // 制御点を計算してスムーズな曲線を作成
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    // Catmull-Rom スプラインの制御点を計算
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

// メイン関数：等高線背景のSVG data URLを生成
export function generateContourBackground(): string {
  try {
    const width = 2300;
    const height = 1480;
    const levels = [10, 20, 30, 40, 50, 60, 70, 80, 90]; // 適切な間隔の等高線

    // 等高線を生成（解像度を上げる）
    const rawContourLines = generateContourLines(width, height, levels, 80);

    // 線分を連結して滑らかな等高線を作成
    const connectedLines = connectContourLines(rawContourLines);

    // 滑らかなSVGパスを生成
    let pathData = '';
    for (const line of connectedLines) {
      if (line.points.length >= 2) {
        pathData += generateSmoothPath(line.points) + ' ';
      }
    }

    // SVGを構築
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .contour-line {
              fill: none;
              stroke: #6b7280;
              stroke-width: 1;
              stroke-opacity: 0.2;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="transparent"/>
        <path class="contour-line" d="${pathData}"/>
      </svg>
    `.trim();

    // data URLを生成
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;

  } catch (error) {
    console.warn('Failed to generate contour background:', error);
    return ''; // フォールバック：空文字列（白背景）
  }
}

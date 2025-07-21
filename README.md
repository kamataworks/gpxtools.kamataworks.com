# GPX Tools

[![Deploy to GitHub Pages](https://github.com/kamataworks/gpxtools.kamataworks.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/kamataworks/gpxtools.kamataworks.com/actions/workflows/deploy.yml)

GPXファイルを編集するためのスタンドアロンウェブツール

🌐 **Live Demo**: [https://gpxtools.kamataworks.com](https://gpxtools.kamataworks.com)

## 概要 / Overview

GPX Toolsは、ブラウザ上で動作するGPXファイル編集ツールです。フロントエンドのみで完結し、サーバーにファイルをアップロードすることなく、安全にGPXファイルを処理できます。

GPX Tools is a standalone web application for editing GPX files that runs entirely in your browser. No server upload required - your files stay private and secure.

## 機能 / Features

### 現在利用可能な機能 / Current Features

- ✅ **ファイル読み込み** - GPXファイルのドラッグ&ドロップまたはクリック選択
- ✅ **複数ファイル対応** - 複数のGPXファイルを同時に読み込み
- ✅ **自動ソート** - ファイル内の日付情報に基づく自動ソート
- ✅ **サマリー表示** - ファイル数とトラック数の合計表示
- ✅ **ファイル削除** - 読み込んだファイルの個別削除
- ✅ **レスポンシブデザイン** - モバイル・デスクトップ対応

### 開発予定の機能 / Planned Features

- 🚧 **トラック分割** - 1つのGPXファイル内の複数トラックを個別ファイルに分割
- 🚧 **トラック結合** - 複数のGPXファイルを1つのファイルに結合
- 🚧 **GPXエクスポート** - 編集後のGPXファイルのダウンロード

## 技術スタック / Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **File Handling**: React Dropzone
- **GPX Parsing**: Native DOM Parser
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## 開発 / Development

### 前提条件 / Prerequisites

- Node.js 20.x以上
- npm

### セットアップ / Setup

```bash
# リポジトリをクローン
git clone https://github.com/kamataworks/gpxtools.kamataworks.com.git
cd gpxtools.kamataworks.com

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

開発サーバーは `http://localhost:5173` で起動します。

### ビルド / Build

```bash
# プロダクションビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## デプロイ / Deployment

このプロジェクトはGitHub Actionsを使用して自動デプロイされます。

- `main` ブランチへのプッシュで自動的にGitHub Pagesにデプロイ
- カスタムドメイン `gpxtools.kamataworks.com` を使用
- HTTPS対応

## プロジェクト構造 / Project Structure

```
src/
├── components/          # 再利用可能なUIコンポーネント
│   ├── FileDropZone.tsx    # ファイルドロップエリア
│   ├── FileSummary.tsx     # ファイルサマリー表示
│   └── EditModeButtons.tsx # 編集モードボタン
├── pages/              # ページコンポーネント
│   ├── HomePage.tsx        # メインページ
│   └── EditPage.tsx        # 編集ページ（開発中）
├── types/              # TypeScript型定義
│   └── gpx.ts             # GPX関連の型
├── utils/              # ユーティリティ関数
│   └── gpxParser.ts       # GPX解析ロジック
├── theme.ts            # Material-UIテーマ設定
└── App.tsx             # アプリケーションルート
```

## ライセンス / License

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 貢献 / Contributing

プルリクエストやイシューの報告を歓迎します。

Issues and pull requests are welcome.

---

Made with ❤️ by [kamataworks](https://github.com/kamataworks)

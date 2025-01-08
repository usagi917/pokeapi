# PokeSmile - 笑顔でポケモンを見つけよう！

## 概要
PokeSmileは、あなたの笑顔を分析して、その表情に最も合うポケモンを見つけ出すウェブアプリケーションです。カメラで撮影した写真や、アップロードした画像から表情を分析し、あなたの性格や感情に合ったポケモンを提案します。

## 特徴
- 🎥 リアルタイムカメラ撮影機能
- 📁 画像アップロード機能
- 😊 AIによる表情分析
- ⚡ PokeAPIとの連携による豊富なポケモンデータ
- 🎯 性格に基づいたポケモンマッチング

## 技術スタック
- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Node.js, Express
- AI: Blazeface（顔検出モデル）
- API: PokeAPI
- コンテナ化: Docker

## セットアップ方法

### Dockerを使用する場合
## 使い方
1. ウェブブラウザで `http://localhost:3000` にアクセス
2. 「カメラを起動」ボタンをクリックするか、画像をアップロード
3. 表情を分析し、マッチするポケモンが表示されます

## 注意事項
- カメラ機能を使用するには、ブラウザのカメラ許可が必要です
- 安定した動作のために、十分な明るさを確保してください
- 推奨ブラウザ: Chrome, Firefox, Safari最新版

## ライセンス
MIT License

## 開発者向け情報
- Node.js version: 16.x以上推奨
- 開発環境の設定は`.nvmrc`ファイルを参照してください
- APIエンドポイント: `http://localhost:3001/api/getPokemon`

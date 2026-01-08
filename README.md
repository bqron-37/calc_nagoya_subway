# Nagoya Subway Route Calculator

名古屋市営地下鉄の経路・料金計算アプリケーションです。
FastAPI (バックエンド) と Next.js (フロントエンド) で構成されています。

## 前提条件

*   Python 3.x
*   Node.js (v18以上推奨)

## セットアップ

### 1. バックエンド (Python)
プロジェクトルートディレクトリで以下のコマンドを実行し、依存ライブラリをインストールします。

```bash
pip install -r requirements.txt
```

### 2. フロントエンド (Next.js)
frontendディレクトリに移動し、ライブラリをインストールします。

```bash
cd frontend
npm install
```

## 起動方法

バックエンドとフロントエンドをそれぞれ別のターミナルで起動してください。

### ターミナル 1: バックエンド (APIサーバー)
プロジェクトルートディレクトリで実行します。

```bash
# Windows / Mac / Linux 共通
python -m uvicorn main:app --reload
```
※ `uvicorn` コマンドがパスに通っている場合は `uvicorn main:app --reload` でも可。

サーバーが起動すると `http://127.0.0.1:8000` で待機します。

### ターミナル 2: フロントエンド (Web UI)
frontendディレクトリで実行します。

```bash
cd frontend
npm run dev
```

サーバーが起動したら、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

## プロジェクト構成

*   `main.py`: バックエンドAPIサーバー (FastAPI)
*   `calculator.py`: 経路計算ロジック
*   `frontend/`: フロントエンドアプリケーション (Next.js)

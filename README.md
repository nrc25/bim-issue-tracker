# 🏗️ APS Viewer 施工指摘管理ツール — MVP

APS (Autodesk Platform Services) Viewer と連携し、BIMモデル上の指摘をピンで管理する施工現場向けWebアプリケーション。

## 🚀 クイックスタート
1. インフラ起動: `docker compose up -d`
2. 依存インストール: `npm install`
3. DB セットアップ: `npx prisma db push && npx prisma generate`
4. 開発サーバー起動: `npm run dev`
ブラウザで http://localhost:3000 を開く。

## 📐 8. 設計要求 (Architecture & Domain Design)

### 8.1 アーキテクチャ
Domain / Application / Infrastructure / Presentation の4層で構成（Onion Architecture）。依存方向は外側から内側へ統一し、外部ライブラリへの依存は Infrastructure 層に隔離しています。詳細は `docs/architecture.md` を参照。

### 8.2 ドメイン設計
`Issue` を中心に、座標・状態・写真メタデータを管理。集約ルートとして整合性を保証し、不正な生成を制御しています。詳細は `docs/er.md` を参照。

### 8.3 読み取りと書き込みの整理 (CQRS)
GET系（Query）とPOST系（Command）のUseCaseを完全に分離しています。詳細は `docs/api.md` を参照。
**【件数増加時の設計方針】**
1. **Query側の最適化:** PostgreSQLの「Materialized View」や Elasticsearch を導入し、読み取り負荷をDBから分離。
2. **ページネーション:** Cursor-based Pagination を採用し、大量データ取得時のパフォーマンスとメモリ消費を最適化。
3. **Command側の非同期化:** 重い書き込み（画像処理や外部連携）は、メッセージキューを用いたバックグラウンド処理へ移行。

### 8.4 永続化
指摘情報は PostgreSQL、写真バイナリは MinIO (Object Storage) で管理。Repository インターフェースにより DB 実装の詳細を隠蔽しています。

### 8.5 外部依存の隔離
APS Viewer 操作は `use-forge-viewer.ts` に集約。ストレージ操作もポート経由で行い、特定ベンダーへのロックインを回避。

### 8.6 本番拡張の想定
認証/認可（RBAC）の導入、現場単位のマルチテナント化、大量ピン描画時のクラスタリング処理の導入を想定。

## ⚠️ スコープマネジメントと既知の課題 (Known Issues)
MVPの目的である「3D空間とDBの連携検証」を最速で達成するため、以下の調整を行っています。
* **写真複数添付:** DBは 1:N 設計済みですが、UI実装は単一画像追加を優先。
* **ステータス戻し:** MVPではハッピーパス進行を優先。
* **ピンのめり込み:** 高層建物等でのオクルージョン判定。座標保存は正常です。
* **フェッチ警告:** 開発環境のホットリロード時等に発生する TypeError。

## 📄 ドキュメント一覧
詳細は `/docs` ディレクトリを参照してください。
* [アーキテクチャ図](./docs/architecture.md)
* [ER図 (ドメインモデル)](./docs/er.md)
* [API設計資料](./docs/api.md)
* [AI駆動開発 コラボレーションログ](./docs/ai_collaboration_log.md)

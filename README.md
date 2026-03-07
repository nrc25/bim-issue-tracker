# 🏗️ APS Viewer 施工指摘管理ツール — MVP

APS (Autodesk Platform Services) Viewer と連携し、BIMモデル上の指摘をピンで管理する施工現場向けWebアプリケーション。

## クイックスタート

```bash
# 1. インフラ起動
docker compose up -d

# 2. 依存インストール
npm install

# 3. DB セットアップ
npx prisma db push
npx prisma generate

# 4. 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

---

## ディレクトリ構成

```
src/
├── domain/                      # ドメイン層 (最内層 — 外部依存ゼロ)
│   ├── model/
│   │   └── issue.ts             # Issue 集約ルート
│   ├── value-object/
│   │   ├── issue-id.ts          # Issue 識別子
│   │   ├── issue-status.ts      # ステータス + 遷移ルール
│   │   ├── pin-location.ts      # 3D座標 Value Object
│   │   └── photo.ts             # 写真エンティティ
│   ├── event/
│   │   ├── domain-event.ts      # ドメインイベント基底
│   │   └── issue-events.ts      # Issue 関連イベント
│   └── service/
│       └── issue-domain-service.ts
│
├── application/                 # アプリケーション層 (ユースケース)
│   ├── command/                 # CQRS Write 側
│   │   ├── create-issue.ts      # 指摘作成コマンド
│   │   ├── transition-issue.ts  # ステータス遷移コマンド
│   │   └── attach-photo.ts      # 写真添付コマンド
│   ├── query/                   # CQRS Read 側
│   │   ├── get-issues.ts        # 指摘一覧クエリ
│   │   └── get-issue-by-id.ts   # 指摘詳細クエリ
│   └── port/                    # 依存性逆転のインターフェース
│       ├── issue-repository.ts  # Repository ポート
│       └── object-storage.ts    # ストレージポート
│
├── infrastructure/              # インフラ層 (外部依存の実装)
│   ├── persistence/
│   │   ├── prisma-client.ts     # Prisma シングルトン
│   │   ├── repository/
│   │   │   └── prisma-issue-repository.ts
│   │   └── mapper/
│   │       └── issue-mapper.ts  # DB ↔ Domain 変換
│   ├── storage/
│   │   └── minio-object-storage.ts
│   └── config/
│       └── container.ts         # DI Composition Root
│
├── presentation/                # プレゼンテーション層
│   ├── api/                     # API Route ハンドラ
│   │   └── issues/
│   │       ├── route.ts         # GET/POST /api/issues
│   │       └── [id]/
│   │           ├── route.ts     # GET /api/issues/:id
│   │           ├── transition/route.ts  # POST .../transition
│   │           └── photos/route.ts      # POST .../photos
│   ├── components/
│   │   ├── ForgeViewer.tsx      # APS Viewer ラッパー
│   │   ├── MockForgeViewer.tsx  # 開発用モック
│   │   └── IssuePanel.tsx       # 指摘管理UI
│   └── hooks/
│       └── use-forge-viewer.ts  # Viewer カスタムフック
│
├── app/                         # Next.js App Router エントリ
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/                     # ルーティング → presentation へ委譲
│       └── issues/
│           └── ...
│
prisma/
│   └── schema.prisma            # DB スキーマ定義
│
docker-compose.yml               # PostgreSQL + MinIO
```

---

## アーキテクチャ設計

### 1. レイヤードアーキテクチャと依存方向

本プロジェクトは **Onion Architecture** の思想に基づく3層+α構成を採用しています。

```
┌─────────────────────────────────────────────┐
│  Presentation (API Routes, React UI)        │
├─────────────────────────────────────────────┤
│  Application (Command/Query Handlers)       │
├─────────────────────────────────────────────┤
│  Domain (Entities, Value Objects, Events)   │  ← 最内層
├─────────────────────────────────────────────┤
│  Infrastructure (Prisma, MinIO, Config)     │
└─────────────────────────────────────────────┘
```

**依存方向は常に内側に向かいます。**

- `Domain` 層は一切の外部依存を持たない（純粋なTypeScript）
- `Application` 層は `Domain` のみに依存し、インフラへの依存は **Port (インターフェース)** 経由
- `Infrastructure` 層が Port を **実装** する（依存性逆転の原則 / DIP）
- `Presentation` 層は Application 層のハンドラを呼び出すだけ

この構造により、PostgreSQL を別のDBに差し替える場合も `infrastructure/persistence/` 以下のみの変更で済みます。ドメインロジックやAPIハンドラは一切影響を受けません。

### 2. ドメイン駆動設計 (DDD)

**Issue** を集約ルート (Aggregate Root) として設計しています。

- **Value Object**: `IssueId`, `PinLocation`, `IssueStatus` — 不変で等価性を持つ
- **Entity**: `Photo` — Issue に従属する識別可能なオブジェクト
- **Aggregate Root**: `Issue` — 集約内の整合性を保証
  - コンストラクタを `private` にし、`create()` / `reconstruct()` ファクトリで生成を制御
  - 状態遷移 (`transition()`) はドメイン層で完結。不正な遷移は例外
  - 写真添付 (`attachPhoto()`) の上限チェックもドメイン層で実施
- **Domain Event**: 状態変更時にイベントを蓄積。将来の Event Sourcing / CQRS 完全分離への布石

### 3. CQRS 的分離

```
Write Side (Command)                Read Side (Query)
─────────────────────              ─────────────────────
POST /api/issues                   GET /api/issues
POST /api/issues/:id/transition    GET /api/issues/:id
POST /api/issues/:id/photos
        │                                  │
        ▼                                  ▼
  CreateIssueHandler               GetIssuesQueryHandler
  TransitionIssueHandler           GetIssueByIdQueryHandler
        │                                  │
        ▼                                  ▼
  Domain Model (Issue)             Read DTO (IssueReadModel)
  ┌─────────────────┐             ┌─────────────────────┐
  │ ビジネスルール検証  │             │ 表示に最適化された形式  │
  │ 状態遷移の実行     │             │ 署名付きURL生成      │
  └─────────────────┘             └─────────────────────┘
```

**Write 側** はドメインモデルを経由し、ビジネスルールを厳密に検証した上で永続化します。
**Read 側** はドメインモデルを `IssueReadModel` (DTO) に変換し、APIレスポンスに最適化した形で返します。

MVPでは同一DBを参照していますが、この分離により将来的に：
- Read 側を非正規化テーブルやElasticsearchに切り替え
- Write 側にEvent Sourcingを導入
- Read/Write で別々にスケーリング

といった進化が、既存コードの構造を壊さずに実現できます。

### 4. Repository の抽象化

```typescript
// Application 層が「所有」するインターフェース（Port）
interface IssueRepository {
  save(issue: Issue): Promise<void>;
  findById(id: IssueId): Promise<Issue | null>;
  findAll(): Promise<Issue[]>;
}

// Infrastructure 層が「実装」するアダプター
class PrismaIssueRepository implements IssueRepository { ... }
```

Application 層はインターフェースのみを知り、Prisma / SQL / NoSQL の詳細を一切知りません。Composition Root (`container.ts`) で具象クラスを注入することで、テスト時のモック差し替えも容易です。

### 5. なぜこの設計が優れているか

| 観点 | 設計判断 | メリット |
|------|---------|---------|
| **変更容易性** | レイヤー分離 + DIP | DB/ストレージの差し替えがインフラ層のみで完結 |
| **テスタビリティ** | Port/Adapter パターン | Repository をモックしてドメインロジックを単体テスト可能 |
| **ドメイン保護** | 集約ルート + private constructor | 不正な状態のオブジェクトが生成されない |
| **スケーラビリティ** | CQRS 分離 | Read/Write の独立スケーリングへの発展が容易 |
| **可読性** | Command/Query の明確な分離 | 各ファイルの責務が明確で、新メンバーのオンボーディングが速い |
| **拡張性** | Domain Event の蓄積 | Event Sourcing, 通知, 監査ログへの拡張が容易 |

---

## API エンドポイント

| Method | Path | 説明 | CQRS |
|--------|------|------|------|
| `GET` | `/api/issues` | 指摘一覧取得 | Query |
| `GET` | `/api/issues/:id` | 指摘詳細取得 | Query |
| `POST` | `/api/issues` | 指摘新規作成 | Command |
| `POST` | `/api/issues/:id/transition` | ステータス遷移 | Command |
| `POST` | `/api/issues/:id/photos` | 写真アップロード | Command |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| 3D Viewer | APS Viewer SDK (+ Mock Viewer for dev) |
| Backend | Next.js API Routes (Server-side) |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Object Storage | MinIO (S3互換) |
| Container | Docker Compose |

---

## 状態遷移図

```
    ┌──────┐     ┌────────────┐     ┌──────────┐     ┌────────┐
    │ Open │────▶│ InProgress │────▶│ Resolved │────▶│ Closed │
    └──┬───┘     └─────┬──────┘     └────┬─────┘     └────────┘
       │               │                 │
       │               └─────────────────┘  (InProgress に戻す)
       │                                 │
       └───────── Closed ◀──────────────┘  (どこからでも Close 可)
```

---

## License

MIT

## ⚠️ 既知の課題 (Known Issues)
本MVPフェーズにおいて、以下の挙動は認知済みですが、コア要件の検証を優先するため意図的に許容しています。
* **コンソールの軽微なフェッチエラー:** 開発サーバーのホットリロード時やAPIのポーリング通信時に `TypeError: Load failed` がコンソールに記録される場合がありますが、機能への影響はありません。
* **ForgeViewerの警告:** `Property database integrity not guaranteed` 等の警告は、APS Viewer SDKの仕様およびサンプルのBIMモデルに起因するものであり、描画および座標取得の動作には影響しません。
* **特定のオブジェクト表面でのピンの視認性:** 高層の建物など一部のオブジェクト表面にピンを配置した際、3Dエンジンの隠面消去（オクルージョン）判定により、ピンのアイコンがモデル内部にめり込んで視認しづらくなる場合があります。座標の取得とDBへの保存自体は正常に行われています。

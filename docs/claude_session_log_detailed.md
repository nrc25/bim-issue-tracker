# APS Viewer デバッグセッションログ
## 日時: 2026-03-07（継続第5～6セッション）

---

## プロジェクト情報
- **場所**: `~/Desktop/pr/files/project/aps-issue-tracker`
- **技術スタック**: Next.js 14.2.15 / Prisma / PostgreSQL / APS (Autodesk Platform Services) Viewer
- **リポジトリ**: https://github.com/nrc25/bim-issue-tracker

---

## ✅ 完了済み（累積）
| 項目 | 内容 |
|------|------|
| transition route パスエラー | `../../../../../../` → `../../../../../` |
| photos route パスエラー | 同上 |
| ForgeViewer.tsx 完全書き換え | `pins` prop受け取り、`onNavigateReady` 追加 |
| use-forge-viewer.ts 書き換え | DataVisualization依存 → THREE.js overlay直描画 |
| page.tsx 書き換え | issues state管理、5秒ポーリング、allPins合成 |
| IssuePanel.tsx 修正 | button-in-button解消、詳細展開UI追加 |
| public/pin-icon.svg | 赤ピンSVG作成（404解消） |
| globals.css | `html, body, #__next { height: 100%; }` 追加 |
| git init & push | GitHub `nrc25/bim-issue-tracker` へforce push完了 |

---

## 🛠️ 技術的注意事項（累積）

| 注意事項 | 内容 |
|---------|------|
| heredoc禁止 | TypeScriptの `<` 記号でzshが崩壊するため、ファイル書き込みはPython経由で実施。 |
| 絵文字禁止 | Pythonスクリプト内での絵文字使用によりSyntaxErrorが発生。Unicodeエスケープ等で回避。 |
| DataVisualization | APS公式の拡張機能が不安定なため、THREE.jsのOverlay機能を活用した独自描画へ移行。 |
| 依存性注入 | Application層にPortを定義し、Next.js API Routesから呼び出すクリーンアーキテクチャ構成。 |

---

## 📈 開発プロセスの特記事項
本プロジェクトでは、Claude Codeを実装の主体とし、Geminiをリスクマネージャー（設計レビュー・ドキュメント作成担当）として併用。
複数のAIモデルを「オーケストレート」することで、環境起因のトラブルや3Dエンジンの仕様制限をPdMの判断に基づき迅速に突破。
単なる実装に留まらず、将来のスケーラビリティ（CQRS分離）を見据えたアーキテクチャへのリファクタリングに重点を置いて完遂しました。

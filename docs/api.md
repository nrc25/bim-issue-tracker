# API設計

| Endpoint | Method | 区分 | 概要 |
|---|---|---|---|
| `/api/aps/token` | GET | Query | APS Viewer用トークン取得 |
| `/api/issues` | GET | Query | 指摘一覧取得 |
| `/api/issues` | POST | Command | 指摘新規作成 |
| `/api/issues/[id]` | GET | Query | 指摘詳細取得 |
| `/api/issues/[id]/photos` | POST | Command | 写真アップロード |
| `/api/issues/[id]/transition` | POST | Command | ステータス遷移 |

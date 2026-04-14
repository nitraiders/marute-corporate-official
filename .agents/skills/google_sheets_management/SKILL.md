# Skill: Google Sheets Integrated Management (Googleスプレッドシート連動型管理)

## 概要
Googleスプレッドシートを外部データベースおよびCMSとして利用し、Node.js (Express) サーバーを介してフロントエンドと同期させる、小・中規模プロジェクト向けの強力な永続化パターン。

## 習得コンテクスト
- **プロジェクト**: まるて株式会社 (MARUTE)
- **課題**: Renderの無料/スタータープランにおける「再起動時のデータ消失」の回避、およびクライアント自身によるスマホからのリアルタイム更新。

## 技術的構成
1.  **DB背景 (Google Sheets)**:
    - 複数のタブ（`partners`, `yuzuki_news` 等）でデータを構造化。
2.  **Logic部 (Google Apps Script)**:
    - `doGet(e)`: クエリパラメータ `sheet` に応じて動的にシートを切り替え、JSONで返却。
    - `doPost(e)`: `target` パラメータに基づき、指定のシートへ日付付きでデータを挿入。
3.  **Proxy部 (server.js)**:
    - GASのURLを秘匿し、CORS問題や認証をバックエンドで解決。
    - パスワード認証 (`marute96`) をフロントエンドとの間に挟むことで安全性を確保。
4.  **Display部 (Frontend)**:
    - `fetch` による非同期取得。
    - パートナー一覧（昇順）とニュース（降順・日付表示）など、用途に応じたソートロジックの適用。

## 秘伝の掟（ベストプラクティス）
*   **iOSズーム制圧**: 管理画面の入力フォームでは `font-size: 16px` を徹底し、iOS特有の自動ズームを防ぐ。
*   **Redirect vs Direct**: 通信の安定性を高めるため、フロントエンドからは `/api/data?sheet=xxx` のような直リンクを用いることが推奨される。
*   **柔軟なスキーマ**: GAS側で `params.content` が無い場合に提携企業用の `name/url` を使うなど、入力項目が異なるシートも一つの `doPost` で柔軟に捌く。

## 関連プロジェクト
- [MARUTE_MANUAL.md](file:///c:/Users/NEC-PCuser/Documents/kazu_midnight_fortress/marute-site/MARUTE_MANUAL.md)
- [FORTRESS_MANUAL.md](file:///c:/Users/NEC-PCuser/Documents/kazu_midnight_fortress/project-s-responsive/FORTRESS_MANUAL.md)

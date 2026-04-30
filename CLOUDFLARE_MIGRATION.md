# Cloudflare Pages への移行マニュアル

まるて株式会社 公式サイトを Render から Cloudflare Pages へ移行するための手順書です。
Cloudflare Pages を利用することで、サーバー維持費の削減（無料枠内）とサイトの高速化が期待できます。

## 1. 事前準備
GitHub リポジトリ `nitraiders/marute-corporate-official` の `main` ブランチに最新のコードが push されていることを確認してください。

## 2. Cloudflare Pages でのプロジェクト作成
1.  [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインします。
2.  左メニューの **[Workers & Pages]** > **[概要]** を選択します。
3.  **[作成]** > **[Pages]** > **[Git に接続]** をクリックします。
4.  GitHub アカウントを連携し、リポジトリ `nitraiders/marute-corporate-official` を選択します。

## 3. ビルド設定
設定画面で以下の通り入力します：

*   **プロジェクト名**: `marute-96` (任意)
*   **プロダクション ブランチ**: `main`
*   **フレームワーク プリセット**: `None`
*   **ビルドコマンド**: (空欄のまま)
*   **ビルド出力ディレクトリ**: `/` (ルートディレクトリ)

## 4. 環境変数の設定 (重要)
セキュリティと柔軟性のため、以下の環境変数を設定してください。
1.  **[設定]** > **[環境変数]** タブを開きます。
2.  **[変数を追加]** をクリックし、以下の2つを登録します：

| 変数名 | 値 | 説明 |
| :--- | :--- | :--- |
| `GAS_URL` | `https://script.google.com/macros/s/AKfycbzE0IFfIHFFs4tdURFfj1HIwgI95TTijbT7FU4o37gQwXL96FpTVq6q-T8qv_5PUkJ54Q/exec` | Google Apps Script の Web アプリ URL |
| `ADMIN_PASSWORD` | `marute96` | 管理画面のログインパスワード |

※ 設定後、**[保存]** を押し、一度 **[再デプロイ]** を行ってください。

## 5. 独自ドメインの設定
1.  **[カスタム ドメイン]** タブを選択します。
2.  **[カスタム ドメインを設定]** をクリックし、`marute-96.com` を入力します。
3.  Cloudflare が DNS 設定を自動的に行います（Cloudflare でドメイン管理している場合）。

## 6. 移行後の確認
*   `https://marute-96.pages.dev` (または独自ドメイン) にアクセスし、正常に表示されるか確認。
*   `/admin.html` にアクセスし、データの追加・削除が正常に動作するか確認。

---
### テクニカルメモ
*   **バックエンド処理**: `functions/api/` 内のスクリプトが Express サーバーの代わりを担います。
*   **キャッシュ制御**: Cloudflare による過度なキャッシュを防ぐため、API レスポンスには `Cache-Control: no-cache` を付与済みです。
*   **バックアップ**: Render 版の最終コードは `backup-render-final` ブランチに保存されています。

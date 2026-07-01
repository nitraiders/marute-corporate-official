# HANDOVER (引き継ぎ資料 - Tempest 会員管理システム)

## 概要
Tempest会員管理における各機能の実装仕様と運用の注意点です。

## 実装仕様

### 1. 会員論理削除機能 (2026-06-25)
* **カラム拡張**: `members` テーブルに `deleted_at TEXT` カラムを追加。値が存在する場合は削除済み。
* **APIフィルター**: ログイン・一覧取得・ポイント付与APIのすべてにおいて `deleted_at IS NULL` である会員のみを操作可能に制限。
* **新規API**: POST `/api/members/delete` （管理者認証が必要）。

### 2. お知らせ・クーポン改行表示機能 (2026-06-25)
* **UI調整**: 管理画面 (`admin/members/index.html`) および会員マイページ (`members/login/index.html`) のお知らせ要素に `style="white-space: pre-line;"` を適用し、iPhoneから入力された改行文字が画面上で正しくレンダリングされるように対応。

### 3. 会員メモ欄・来店取消（-1）機能 (2026-07-01)
* **カラム拡張**: `members` テーブルに `admin_memo TEXT` カラムを追加。
* **API追加/変更**:
  * POST `/api/members/update-memo` を新設し、管理者トークン認証を経て会員ごとにメモが書き換え可能（空欄の場合はnull）。
  * POST `/api/members/points` に `operationType: 'visit_cancel'` を追加し、来店回数と保有ポイントを1ずつ安全に差し引くように拡張（来店回数0回時は操作不可）。
* **UI変更**:
  * 一覧のクイックアクションエリアに「来店取消 -1」（スマホでは「来店-1」）ボタンおよびメモのインライン保存エリアを配置。
  * `confirm` ダイアログを挟み誤操作を防止。

### 4. ポイント交換カタログ機能 (2026-07-01)
* **新規テーブル追加**: `point_catalog` テーブル (id, shop_code, points, title, display_order, is_active, created_at, updated_at) およびインデックスを追加。
* **API追加**:
  * GET `/api/members/point-catalog` (会員用: activeでtempest向けリストを並び順で返却)。
  * GET/POST `/api/members/admin-point-catalog` (管理用: 認証必須。追加・更新・無効化のaction対応)。
* **UI変更**:
  * 管理画面に「ポイント交換メニュー設定」タブを新設し、インラインでの編集、有効/無効、並び替え機能を提供。
  * 会員マイページの現在ポイント下部に「ポイント交換メニューを見る」モーダル展開ボタンを設置。XSS対策として `textContent` で動的レンダリング。

## 運用時の注意事項
* **会員番号の再利用防止**:
  * 新規登録時の自動採番ロジック `getNextMemberNo` は、`deleted_at` に関係なくデータベース全体の最大番号（数値部）を基準とするため、論理削除された番号が再利用されることはありません。
* **スマホ表示のレスポンシブ崩れ防止**:
  * 各種モーダル、入力フォーム、ボタンエリアは `@media (max-width: 600px)` 下で縦積みまたは全幅にレスポンシブ化されています。HTMLを編集する際は 390px 前後での横はみ出し（横スクロール）が発生しないことを確認してください。
* **スキーマファイル**:
  * [schema/member_points.sql](file:///c:/Users/NEC-PCuser/Documents/kazu_midnight_fortress/marute-site/schema/member_points.sql) を更新済みです。新しい環境の初期化にはこれを使用します。
* **コミット対象外ファイル**:
  * `assets/images/marute_newtitle.mp4` は未追跡 (Untracked) を維持してください。
  * `.wrangler/` ディレクトリは `.gitignore` に登録されています。

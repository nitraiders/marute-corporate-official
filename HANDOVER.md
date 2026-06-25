# HANDOVER (引き継ぎ資料 - Tempest 会員削除機能)

## 概要
Tempest会員管理における「会員論理削除」機能の実装仕様と運用の注意点です。

## 実装仕様
1. **データベースのカラム拡張**
   * `members` テーブルに `deleted_at TEXT` カラムを追加。値が存在する場合は削除済みとみなされます（論理削除）。
2. **論理削除ロジックの適用箇所**
   * **一覧取得API**: `/api/members` -> `deleted_at IS NULL` を条件に追加
   * **ログインAPI**: `/api/members/login` -> `deleted_at IS NULL` を条件に追加
   * **ポイントAPI**: `/api/members/points` -> `deleted_at IS NULL` を条件に追加
3. **新規削除APIの追加**
   * POST `/api/members/delete` (管理者認証が必要)
   * `UPDATE members SET deleted_at = ?1, updated_at = ?2 WHERE member_no = ?3` で論理削除を実行。
4. **UIの変更**
   * Tempest会員一覧 (`admin/members/index.html`) に「削除」ボタンを追加。
   * 誤操作防止のため、会員番号とニックネームを表示する `confirm` ダイアログを挟んで実行。

## 運用時の注意事項
* **会員番号の再利用防止**:
  * 新規登録時の自動採番ロジック `getNextMemberNo` は、`deleted_at` に関係なくデータベース全体の最大番号（数値部）を基準とするため、論理削除された番号が再利用されることはありません。
* **スキーマファイル**:
  * [schema/member_points.sql](file:///c:/Users/NEC-PCuser/Documents/kazu_midnight_fortress/marute-site/schema/member_points.sql) を更新済みです。新しい環境の初期化にはこれを使用します。
* **コミット対象外ファイル**:
  * `assets/images/marute_newtitle.mp4` は未追跡 (Untracked) を維持してください。
  * `.wrangler/` ディレクトリは `.gitignore` に登録されています。

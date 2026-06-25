# Tempest Member Points Spreadsheet Next Step

## Purpose

Cloudflare D1 is the source of truth for the preview member points feature.
Google Sheets integration is a later operational step, not part of the current preview.

## Next Scope

- Export or sync members, point logs, and announcements to a Google Spreadsheet.
- Keep point updates in the admin ledger as the primary operation.
- Use Google Sheets mainly for owner review, backup, and lightweight reporting.

## Proposed Direction

1. Keep writes in Cloudflare Pages Functions and D1.
2. Add a server-side sync endpoint that requires an admin token or scheduled secret.
3. Send sanitized rows to GAS or Google Sheets API.
4. Avoid bidirectional sync until conflict rules are decided.

## Fields To Sync

- members: member_no, nickname, birth_month, birth_day, points, visit_count, created_at, updated_at, last_visit_at
- point_logs: member_no, point_delta, reason, operation_type, memo, created_at
- announcements: title, body, target_type, target_member_no, target_birth_month, start_at, end_at, is_active, created_at

## Decisions Before Implementation

- One-way sync from D1 to Sheets, or future two-way editing.
- Manual sync button, scheduled sync, or both.
- Whether Sheets is allowed to edit points directly.
- How to handle conflicts if the same member is changed in both places.
- Whether test preview data should be excluded from production sheets.

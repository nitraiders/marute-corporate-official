import { verifyAdminToken } from '../auth.js';

function csvResponse(filename, rows) {
    return new Response(rows.join('\n'), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
}

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function csvEscape(value) {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.MARUTE_DB;
    const adminPassword = env.MARUTE_ADMIN_PASSWORD;

    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!adminPassword || !adminPassword.trim()) {
        return jsonResponse({ error: 'Admin password is not configured' }, 500);
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token') || '';
    if (!(await verifyAdminToken(token, adminPassword))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const type = url.searchParams.get('type') || 'members';
    if (type === 'point_logs') {
        const result = await db.prepare(`
            SELECT m.member_no, m.nickname, l.point_delta, l.reason, l.operation_type, l.memo, l.created_at
            FROM point_logs l
            JOIN members m ON m.id = l.member_id
            ORDER BY l.created_at DESC
        `).all();
        const rows = ['member_no,nickname,point_delta,reason,operation_type,memo,created_at'];
        for (const row of result.results || []) {
            rows.push([row.member_no, row.nickname, row.point_delta, row.reason, row.operation_type, row.memo, row.created_at].map(csvEscape).join(','));
        }
        return csvResponse('point_logs.csv', rows);
    }

    const result = await db.prepare(`
        SELECT member_no, nickname, birth_month, birth_day, points, visit_count, created_at, updated_at, last_visit_at
        FROM members
        ORDER BY member_no
    `).all();
    const rows = ['member_no,nickname,birth_month,birth_day,points,visit_count,created_at,updated_at,last_visit_at'];
    for (const row of result.results || []) {
        rows.push([row.member_no, row.nickname, row.birth_month, row.birth_day, row.points, row.visit_count, row.created_at, row.updated_at, row.last_visit_at].map(csvEscape).join(','));
    }
    return csvResponse('members.csv', rows);
}

import { verifyAdminToken } from '../auth.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
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
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!(await verifyAdminToken(token, adminPassword))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const memberNo = (url.searchParams.get('memberNo') || '').trim().toUpperCase();
    if (!memberNo) {
        return jsonResponse({ error: 'Member number is required' }, 400);
    }

    const logs = await db.prepare(`
        SELECT l.point_delta, l.reason, l.operation_type, l.memo, l.created_at
        FROM point_logs l
        JOIN members m ON m.id = l.member_id
        WHERE m.member_no = ?1
        ORDER BY l.created_at DESC
        LIMIT 50
    `).bind(memberNo).all();

    return jsonResponse({ logs: logs.results || [] });
}

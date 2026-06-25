import { verifyAdminToken } from '../auth.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function hasAdminPassword(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

export async function onRequestPost(context) {
    const { env } = context;
    const db = env.MARUTE_DB;
    const adminPassword = env.MARUTE_ADMIN_PASSWORD;

    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!hasAdminPassword(adminPassword)) {
        return jsonResponse({ error: 'Admin password is not configured' }, 500);
    }

    const body = await context.request.json();
    const token = body.token;
    if (!(await verifyAdminToken(token, adminPassword))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const memberNo = String(body.memberNo || '').trim().toUpperCase();
    if (!memberNo) {
        return jsonResponse({ error: 'Member number is required' }, 400);
    }

    const member = await db.prepare('SELECT * FROM members WHERE member_no = ?1').bind(memberNo).first();
    if (!member) {
        return jsonResponse({ error: 'Member not found' }, 404);
    }

    // すでに削除済みの場合は何もしない（正常終了）
    if (member.deleted_at) {
        return jsonResponse({ success: true, message: 'Member already deleted' });
    }

    const now = new Date().toISOString();
    await db.prepare('UPDATE members SET deleted_at = ?1, updated_at = ?2 WHERE member_no = ?3')
        .bind(now, now, memberNo)
        .run();

    return jsonResponse({ success: true });
}

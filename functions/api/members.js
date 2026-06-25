import { verifyAdminToken } from './auth.js';
import { SHOP_CONFIG } from './members/config.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function getDatabase(env) {
    return env.MARUTE_DB;
}

function hasAdminPassword(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function publicMember(row) {
    return {
        memberNo: row.member_no,
        nickname: row.nickname,
        birthMonth: row.birth_month,
        birthDay: row.birth_day,
        points: row.points,
        visitCount: row.visit_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastVisitAt: row.last_visit_at
    };
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = getDatabase(env);
    const adminPassword = env.MARUTE_ADMIN_PASSWORD;

    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!hasAdminPassword(adminPassword)) {
        return jsonResponse({ error: 'Admin password is not configured' }, 500);
    }

    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : url.searchParams.get('token');
    if (!(await verifyAdminToken(token, adminPassword))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const query = (url.searchParams.get('q') || '').trim();
    const statement = query
        ? db.prepare(`
            SELECT * FROM members
            WHERE member_no LIKE ?1
              AND (member_no LIKE ?2 OR nickname LIKE ?2)
            ORDER BY created_at DESC
            LIMIT 100
        `).bind(`${SHOP_CONFIG.memberPrefix}-%`, `%${query}%`)
        : db.prepare(`
            SELECT * FROM members
            WHERE member_no LIKE ?1
            ORDER BY created_at DESC
            LIMIT 100
        `).bind(`${SHOP_CONFIG.memberPrefix}-%`);
    const result = await statement.all();

    return jsonResponse({
        members: (result.results || []).map(publicMember)
    });
}

import { verifyAdminToken } from '../auth.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function requireAdmin(request, env) {
    const adminPassword = env.MARUTE_ADMIN_PASSWORD;
    if (!adminPassword || !adminPassword.trim()) return false;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    return verifyAdminToken(token, adminPassword);
}

function toStartIso(value) {
    return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function toEndIso(value) {
    return value ? new Date(`${value}T23:59:59`).toISOString() : null;
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const db = env.MARUTE_DB;
    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!(await requireAdmin(request, env))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const result = await db.prepare(`
        SELECT a.id, a.title, a.body, a.target_type, a.target_birth_month,
               a.start_at, a.end_at, a.is_active, a.created_at, m.member_no AS target_member_no
        FROM announcements a
        LEFT JOIN members m ON m.id = a.target_member_id
        ORDER BY a.created_at DESC
        LIMIT 50
    `).all();
    return jsonResponse({ announcements: result.results || [] });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const db = env.MARUTE_DB;
    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!(await requireAdmin(request, env))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const body = await request.json();
    const title = String(body.title || '').trim().slice(0, 80);
    const announcementBody = String(body.body || '').trim().slice(0, 500);
    const targetType = ['all', 'birth_month', 'member'].includes(body.targetType) ? body.targetType : 'all';
    const targetBirthMonth = targetType === 'birth_month' ? Number(body.targetBirthMonth) : null;
    const targetMemberNo = targetType === 'member' ? String(body.targetMemberNo || '').trim().toUpperCase() : '';
    const startAt = toStartIso(body.startAt);
    const endAt = toEndIso(body.endAt);
    const isActive = body.isActive ? 1 : 0;

    if (!title || !announcementBody) {
        return jsonResponse({ error: 'Title and body are required' }, 400);
    }
    if (targetType === 'birth_month' && (!Number.isInteger(targetBirthMonth) || targetBirthMonth < 1 || targetBirthMonth > 12)) {
        return jsonResponse({ error: 'Target birth month is invalid' }, 400);
    }

    let targetMemberId = null;
    if (targetType === 'member') {
        const member = await db.prepare('SELECT id FROM members WHERE member_no = ?1').bind(targetMemberNo).first();
        if (!member) {
            return jsonResponse({ error: 'Target member not found' }, 400);
        }
        targetMemberId = member.id;
    }

    const now = new Date().toISOString();
    await db.prepare(`
        INSERT INTO announcements (
            title, body, target_type, target_member_id, target_birth_month,
            start_at, end_at, is_active, created_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(title, announcementBody, targetType, targetMemberId, targetBirthMonth, startAt, endAt, isActive, now).run();

    return jsonResponse({ ok: true }, 201);
}

export async function onRequestPatch(context) {
    const { request, env } = context;
    const db = env.MARUTE_DB;
    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!(await requireAdmin(request, env))) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) {
        return jsonResponse({ error: 'Announcement id is invalid' }, 400);
    }

    await db.prepare('UPDATE announcements SET is_active = ?1 WHERE id = ?2').bind(body.isActive ? 1 : 0, id).run();
    return jsonResponse({ ok: true });
}

import { verifyAdminToken } from '../auth.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

const QUICK_REASONS = {
    visit: '来店',
    companion: '同伴',
    bottle: 'ボトル',
    manual: '手動調整'
};

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
    const pointDelta = Number(body.pointDelta);
    const operationType = String(body.operationType || 'manual').trim();
    const reason = String(body.reason || QUICK_REASONS[operationType] || '手動調整').trim().slice(0, 60);
    const memo = String(body.memo || '').trim().slice(0, 200);

    if (!memberNo || !Number.isInteger(pointDelta) || pointDelta === 0) {
        return jsonResponse({ error: 'Member number and non-zero point delta are required' }, 400);
    }
    if (operationType === 'manual' && !memo) {
        return jsonResponse({ error: 'Memo is required for manual point adjustments' }, 400);
    }

    const member = await db.prepare('SELECT * FROM members WHERE member_no = ?1').bind(memberNo).first();
    if (!member) {
        return jsonResponse({ error: 'Member not found' }, 404);
    }

    const now = new Date().toISOString();
    const nextPoints = Math.max(0, Number(member.points || 0) + pointDelta);
    const visitIncrement = operationType === 'visit' ? 1 : 0;

    await db.batch([
        db.prepare(`
            UPDATE members
            SET points = ?1,
                visit_count = visit_count + ?2,
                updated_at = ?3,
                last_visit_at = ?3
            WHERE id = ?4
        `).bind(nextPoints, visitIncrement, now, member.id),
        db.prepare(`
            INSERT INTO point_logs (
                member_id, point_delta, reason, operation_type, memo, created_at
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        `).bind(member.id, pointDelta, reason, operationType, memo, now)
    ]);

    return jsonResponse({
        member: {
            memberNo: member.member_no,
            nickname: member.nickname,
            points: nextPoints,
            visitCount: Number(member.visit_count || 0) + visitIncrement,
            lastVisitAt: now
        }
    });
}

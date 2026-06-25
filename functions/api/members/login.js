import { SHOP_CONFIG, normalizeMemberNo } from './config.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function publicMember(row) {
    return {
        id: row.id,
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

function normalizePin(value) {
    return String(value || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
}

function parseLoginBody(body) {
    const rawCode = String(body.memberCode || body.memberNo || '').trim().toUpperCase();
    const compact = rawCode.replace(/[^A-Z0-9]/g, '');
    const combinedMatch = compact.match(new RegExp(`^${SHOP_CONFIG.memberPrefix}(\\d{4,})(\\d{4})$`));
    if (combinedMatch && !body.birthdayPin) {
        return {
            memberNo: normalizeMemberNo(combinedMatch[1]),
            birthdayPin: combinedMatch[2]
        };
    }
    const numericCombinedMatch = compact.match(/^(\d{4})(\d{4})$/);
    if (numericCombinedMatch && !body.birthdayPin) {
        return {
            memberNo: normalizeMemberNo(numericCombinedMatch[1]),
            birthdayPin: numericCombinedMatch[2]
        };
    }
    return {
        memberNo: normalizeMemberNo(rawCode),
        birthdayPin: normalizePin(body.birthdayPin)
    };
}

export async function onRequestPost(context) {
    const db = context.env.MARUTE_DB;
    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }

    const body = await context.request.json();
    const { memberNo, birthdayPin } = parseLoginBody(body);

    if (!memberNo || birthdayPin.length !== 4) {
        return jsonResponse({ error: 'Member number and birthday PIN are required' }, 400);
    }

    const member = await db.prepare(`
        SELECT * FROM members
        WHERE member_no = ?1 AND birthday_pin = ?2
    `).bind(memberNo, birthdayPin).first();

    if (!member) {
        return jsonResponse({ error: 'Member not found' }, 404);
    }

    const logs = await db.prepare(`
        SELECT point_delta, reason, operation_type, memo, created_at
        FROM point_logs
        WHERE member_id = ?1
        ORDER BY created_at DESC
        LIMIT 20
    `).bind(member.id).all();

    const now = new Date().toISOString();
    const announcements = await db.prepare(`
        SELECT title, body, target_type, start_at, end_at
        FROM announcements
        WHERE is_active = 1
          AND (start_at IS NULL OR start_at <= ?1)
          AND (end_at IS NULL OR end_at >= ?1)
          AND (
            target_type = 'all'
            OR (target_type = 'birth_month' AND target_birth_month = ?2)
            OR (target_type = 'member' AND target_member_id = ?3)
          )
        ORDER BY created_at DESC
        LIMIT 10
    `).bind(now, member.birth_month, member.id).all();

    return jsonResponse({
        member: publicMember(member),
        logs: logs.results || [],
        announcements: announcements.results || []
    });
}

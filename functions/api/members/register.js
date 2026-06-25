import { SHOP_CONFIG } from './config.js';

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function normalizeDayPart(value) {
    return String(value || '').replace(/\D/g, '').padStart(2, '0').slice(-2);
}

function isValidBirthday(month, day) {
    const numericMonth = Number(month);
    const numericDay = Number(day);
    return Number.isInteger(numericMonth) && Number.isInteger(numericDay)
        && numericMonth >= 1 && numericMonth <= 12
        && numericDay >= 1 && numericDay <= 31;
}

function isUniqueMemberNoError(error) {
    const message = String(error?.message || error || '').toLowerCase();
    return message.includes('unique') || message.includes('constraint');
}

async function getNextMemberNo(db, offset = 0) {
    const maxResult = await db.prepare(`
        SELECT COALESCE(MAX(CAST(SUBSTR(member_no, 5) AS INTEGER)), 0) AS max_no
        FROM members
        WHERE member_no LIKE ?1
    `).bind(`${SHOP_CONFIG.memberPrefix}-%`).first();
    const nextNumber = Number(maxResult?.max_no || 0) + 1 + offset;
    return `${SHOP_CONFIG.memberPrefix}-${String(nextNumber).padStart(4, '0')}`;
}

export async function onRequestPost(context) {
    const db = context.env.MARUTE_DB;
    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }

    const body = await context.request.json();
    const nickname = String(body.nickname || '').trim().slice(0, 40);
    const birthMonth = normalizeDayPart(body.birthMonth);
    const birthDay = normalizeDayPart(body.birthDay);

    if (!nickname) {
        return jsonResponse({ error: 'Nickname is required' }, 400);
    }
    if (!isValidBirthday(birthMonth, birthDay)) {
        return jsonResponse({ error: 'Birthday month and day are invalid' }, 400);
    }

    const now = new Date().toISOString();
    const birthdayPin = `${birthMonth}${birthDay}`;
    let memberNo = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
        memberNo = await getNextMemberNo(db, attempt);
        try {
            await db.prepare(`
                INSERT INTO members (
                    member_no, nickname, birth_month, birth_day, birthday_pin,
                    points, visit_count, created_at, updated_at, last_visit_at
                )
                VALUES (?1, ?2, ?3, ?4, ?5, 0, 0, ?6, ?6, NULL)
            `).bind(memberNo, nickname, Number(birthMonth), Number(birthDay), birthdayPin, now).run();
            break;
        } catch (error) {
            if (attempt === 4 || !isUniqueMemberNoError(error)) {
                throw error;
            }
        }
    }

    return jsonResponse({
        member: {
            memberNo,
            nickname,
            birthMonth: Number(birthMonth),
            birthDay: Number(birthDay),
            points: 0,
            visitCount: 0,
            createdAt: now,
            updatedAt: now,
            lastVisitAt: null
        },
        birthdayPin,
        memberUrl: `/${SHOP_CONFIG.shopSlug}/members/login/?memberNo=${encodeURIComponent(memberNo)}`
    }, 201);
}

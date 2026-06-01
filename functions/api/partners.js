import { verifyAdminToken } from './auth.js';

export async function onRequest(context) {
    const { request, env } = context;
    const GAS_URL = env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzE0IFfIHFFs4tdURFfj1HIwgI95TTijbT7FU4o37gQwXL96FpTVq6q-T8qv_5PUkJ54Q/exec';
    const ADMIN_PASSWORD = env.MARUTE_ADMIN_PASSWORD;

    if (request.method === "GET") {
        // 後方互換性のため /api/data?sheet=partners へリダイレクト
        return Response.redirect(new URL("/api/news?sheet=partners", request.url), 302);
    }

    if (request.method === "POST") {
        if (!ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Admin password is not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const { name, url, content, token, targetSheet } = body;
        const target = targetSheet || 'partners';

        if (!(await verifyAdminToken(token, ADMIN_PASSWORD))) {
            return new Response(JSON.stringify({ error: 'Invalid password' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 必須チェック
        if (target === 'partners' && (!name || !url)) {
            return new Response(JSON.stringify({ error: 'Name and URL are required for partners' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (target !== 'partners' && !content) {
            return new Response(JSON.stringify({ error: 'Content is required for news' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const payload = { target: target };
            if (target === 'partners') {
                payload.name = name;
                payload.url = url;
            } else {
                payload.content = content;
            }

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            return new Response(JSON.stringify(result), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to add data' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response("Method Not Allowed", { status: 405 });
}

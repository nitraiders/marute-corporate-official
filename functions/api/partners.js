export async function onRequest(context) {
    const { request, env } = context;
    const GAS_URL = env.GAS_URL || 'https://script.google.com/macros/s/AKfycbyzK8Ylb4-ag6whIYVK7LdkKLtd1vIUwzWm61fLs6ky3dfhBWGUA05a8Lp_nKeCWn4sUQ/exec';
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'marute96';

    if (request.method === "GET") {
        // 後方互換性のため /api/data?sheet=partners へリダイレクト
        return Response.redirect(new URL("/api/data?sheet=partners", request.url), 302);
    }

    if (request.method === "POST") {
        const body = await request.json();
        const { name, url, content, password, targetSheet } = body;
        const target = targetSheet || 'partners';

        if (password !== ADMIN_PASSWORD) {
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

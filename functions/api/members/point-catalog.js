function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestGet(context) {
    const { env } = context;
    const db = env.MARUTE_DB;

    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }

    try {
        const result = await db.prepare(`
            SELECT id, points, title, display_order
            FROM point_catalog
            WHERE shop_code = 'tempest' AND is_active = 1
            ORDER BY display_order ASC, points ASC
        `).all();

        return jsonResponse({
            items: result.results || []
        });
    } catch (error) {
        return jsonResponse({ error: 'Database Error', details: error.message }, 500);
    }
}

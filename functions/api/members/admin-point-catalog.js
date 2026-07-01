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

export async function onRequest(context) {
    const { request, env } = context;
    const db = env.MARUTE_DB;
    const adminPassword = env.MARUTE_ADMIN_PASSWORD;

    if (!db) {
        return jsonResponse({ error: 'Configuration Error', details: 'MARUTE_DB D1 binding is not configured.' }, 500);
    }
    if (!hasAdminPassword(adminPassword)) {
        return jsonResponse({ error: 'Admin password is not configured' }, 500);
    }

    // 1. GET リクエスト（全件取得）
    if (request.method === 'GET') {
        const url = new URL(request.url);
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : url.searchParams.get('token');
        if (!(await verifyAdminToken(token, adminPassword))) {
            return jsonResponse({ error: 'Invalid password' }, 403);
        }

        try {
            const result = await db.prepare(`
                SELECT id, points, title, display_order, is_active, created_at, updated_at
                FROM point_catalog
                WHERE shop_code = 'tempest'
                ORDER BY display_order ASC, points ASC
            `).all();

            return jsonResponse({
                items: result.results || []
            });
        } catch (error) {
            return jsonResponse({ error: 'Database Error', details: error.message }, 500);
        }
    }

    // 2. POST リクエスト（追加・変更・無効化）
    if (request.method === 'POST') {
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return jsonResponse({ error: 'Invalid JSON body' }, 400);
        }

        const token = body.token;
        if (!(await verifyAdminToken(token, adminPassword))) {
            return jsonResponse({ error: 'Invalid password' }, 403);
        }

        const action = String(body.action || '').trim();

        if (action === 'add') {
            const points = Number(body.points);
            const title = String(body.title || '').trim();
            const displayOrder = Number(body.displayOrder || 0);

            if (!Number.isInteger(points) || points <= 0) {
                return jsonResponse({ error: 'Points must be a positive integer' }, 400);
            }
            if (!title) {
                return jsonResponse({ error: 'Title is required' }, 400);
            }
            if (!Number.isInteger(displayOrder)) {
                return jsonResponse({ error: 'Display order must be an integer' }, 400);
            }

            const now = new Date().toISOString();
            try {
                await db.prepare(`
                    INSERT INTO point_catalog (shop_code, points, title, display_order, is_active, created_at, updated_at)
                    VALUES ('tempest', ?1, ?2, ?3, 1, ?4, ?4)
                `).bind(points, title, displayOrder, now).run();
                return jsonResponse({ success: true });
            } catch (error) {
                return jsonResponse({ error: 'Database Error', details: error.message }, 500);
            }
        }

        if (action === 'edit') {
            const id = Number(body.id);
            const points = Number(body.points);
            const title = String(body.title || '').trim();
            const displayOrder = Number(body.displayOrder || 0);

            if (!id || !Number.isInteger(id)) {
                return jsonResponse({ error: 'ID is required' }, 400);
            }
            if (!Number.isInteger(points) || points <= 0) {
                return jsonResponse({ error: 'Points must be a positive integer' }, 400);
            }
            if (!title) {
                return jsonResponse({ error: 'Title is required' }, 400);
            }
            if (!Number.isInteger(displayOrder)) {
                return jsonResponse({ error: 'Display order must be an integer' }, 400);
            }

            const now = new Date().toISOString();
            try {
                await db.prepare(`
                    UPDATE point_catalog
                    SET points = ?1, title = ?2, display_order = ?3, updated_at = ?4
                    WHERE id = ?5 AND shop_code = 'tempest'
                `).bind(points, title, displayOrder, now, id).run();
                return jsonResponse({ success: true });
            } catch (error) {
                return jsonResponse({ error: 'Database Error', details: error.message }, 500);
            }
        }

        if (action === 'toggle_active') {
            const id = Number(body.id);
            const isActive = body.isActive ? 1 : 0;

            if (!id || !Number.isInteger(id)) {
                return jsonResponse({ error: 'ID is required' }, 400);
            }

            const now = new Date().toISOString();
            try {
                await db.prepare(`
                    UPDATE point_catalog
                    SET is_active = ?1, updated_at = ?2
                    WHERE id = ?3 AND shop_code = 'tempest'
                `).bind(isActive, now, id).run();
                return jsonResponse({ success: true });
            } catch (error) {
                return jsonResponse({ error: 'Database Error', details: error.message }, 500);
            }
        }

        // 安全のため、削除リクエストがあった場合は is_active = 0 （無効化）を優先
        if (action === 'delete') {
            const id = Number(body.id);
            if (!id || !Number.isInteger(id)) {
                return jsonResponse({ error: 'ID is required' }, 400);
            }

            const now = new Date().toISOString();
            try {
                await db.prepare(`
                    UPDATE point_catalog
                    SET is_active = 0, updated_at = ?1
                    WHERE id = ?2 AND shop_code = 'tempest'
                `).bind(now, id).run();
                return jsonResponse({ success: true });
            } catch (error) {
                return jsonResponse({ error: 'Database Error', details: error.message }, 500);
            }
        }

        return jsonResponse({ error: 'Unsupported action' }, 400);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
}

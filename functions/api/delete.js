import { verifyAdminToken } from './auth.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    const GAS_URL = env.GAS_URL;
    const ADMIN_PASSWORD = env.MARUTE_ADMIN_PASSWORD;

    if (!GAS_URL) {
        return new Response(JSON.stringify({
            error: 'Configuration Error',
            details: 'GAS_URL environment variable is not set in Cloudflare dashboard. Please check your Pages settings.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Admin password is not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { row, token, targetSheet } = await request.json();
    const target = targetSheet || 'partners';

    if (!(await verifyAdminToken(token, ADMIN_PASSWORD))) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!row) {
        return new Response(JSON.stringify({ error: 'Row index is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const payload = { 
            action: 'delete',
            target: target,
            row: row
        };

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
        return new Response(JSON.stringify({ error: 'Failed to delete data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

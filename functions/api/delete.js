export async function onRequestPost(context) {
    const { request, env } = context;
    const GAS_URL = env.GAS_URL || 'https://script.google.com/macros/s/AKfycbyzK8Ylb4-ag6whIYVK7LdkKLtd1vIUwzWm61fLs6ky3dfhBWGUA05a8Lp_nKeCWn4sUQ/exec';
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'marute96';

    const { row, password, targetSheet } = await request.json();
    const target = targetSheet || 'partners';

    if (password !== ADMIN_PASSWORD) {
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

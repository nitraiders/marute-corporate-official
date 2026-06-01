const TOKEN_TTL_SECONDS = 60 * 60 * 4;

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

function toHex(bytes) {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function base64UrlEncode(value) {
    return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value) {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return atob(padded);
}

async function sign(value, secret) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
    return toHex(new Uint8Array(signature));
}

async function createToken(secret) {
    const payload = base64UrlEncode(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    }));
    return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyAdminToken(token, secret) {
    if (!token || !secret) return false;

    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;

    const expectedSignature = await sign(payload, secret);
    if (signature !== expectedSignature) return false;

    try {
        const parsedPayload = JSON.parse(base64UrlDecode(payload));
        return Number(parsedPayload.exp) > Math.floor(Date.now() / 1000);
    } catch (error) {
        return false;
    }
}

export async function onRequestPost(context) {
    const adminPassword = context.env.MARUTE_ADMIN_PASSWORD;
    if (!adminPassword) {
        return jsonResponse({ error: 'Admin password is not configured' }, 500);
    }

    const { password } = await context.request.json();
    if (password !== adminPassword) {
        return jsonResponse({ error: 'Invalid password' }, 403);
    }

    return jsonResponse({
        token: await createToken(adminPassword),
        expiresIn: TOKEN_TTL_SECONDS
    });
}

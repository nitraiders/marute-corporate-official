const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzE0IFfIHFFs4tdURFfj1HIwgI95TTijbT7FU4o37gQwXL96FpTVq6q-T8qv_5PUkJ54Q/exec';
const ADMIN_PASSWORD = process.env.MARUTE_ADMIN_PASSWORD;
const TOKEN_TTL_SECONDS = 60 * 60 * 4;

function base64UrlEncode(value) {
    return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
    return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value, secret) {
    return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function createAdminToken(secret) {
    const payload = base64UrlEncode(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    }));
    return `${payload}.${sign(payload, secret)}`;
}

function verifyAdminToken(token, secret) {
    if (!token || !secret) return false;

    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;

    const expectedSignature = sign(payload, secret);
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
    ) {
        return false;
    }

    try {
        const parsedPayload = JSON.parse(base64UrlDecode(payload));
        return Number(parsedPayload.exp) > Math.floor(Date.now() / 1000);
    } catch (error) {
        return false;
    }
}

app.use(express.json());

// 静的ファイルの配信ディレクトリを指定
app.use((req, res, next) => {
    res.setHeader('Content-Language', 'ja');
    next();
});
app.use(express.static(__dirname));

// --- 共通データ API (提携企業 & ニュース) ---

// 1. 取得 API (GET)
// パラメータ ?sheet=... で対象切り替え
app.get('/api/news', async (req, res) => {
    const sheet = req.query.sheet || 'partners';
    try {
        const response = await fetch(`${GAS_URL}?sheet=${sheet}`);
        const data = await response.json();
        
        let sortedData;
        if (sheet === 'partners') {
            // パートナーは追加順（日付昇順）
            sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            // ニュースは最新順（日付降順）
            sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        res.json(sortedData);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// 後方互換性のため古いパスも残す
app.get('/api/data', (req, res) => {
    const sheet = req.query.sheet || 'partners';
    res.redirect(`/api/news?sheet=${sheet}`);
});
app.get('/api/partners', (req, res) => res.redirect('/api/news?sheet=partners'));

app.post('/api/auth', (req, res) => {
    if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin password is not configured' });
    }

    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    res.json({
        token: createAdminToken(ADMIN_PASSWORD),
        expiresIn: TOKEN_TTL_SECONDS
    });
});

// 2. 追加 API (POST)
app.post('/api/partners', async (req, res) => {
    if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin password is not configured' });
    }

    const { name, url, content, token, targetSheet } = req.body;
    const target = targetSheet || 'partners';

    if (!verifyAdminToken(token, ADMIN_PASSWORD)) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    // 必須チェック（ターゲットに応じて変更）
    if (target === 'partners' && (!name || !url)) {
        return res.status(400).json({ error: 'Name and URL are required for partners' });
    } else if (target !== 'partners' && !content) {
        return res.status(400).json({ error: 'Content is required for news' });
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
        res.json(result);
    } catch (error) {
        console.error('Post error:', error);
        res.status(500).json({ error: 'Failed to add data' });
    }
});

// 3. 削除 API (POST)
app.post('/api/delete', async (req, res) => {
    if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Admin password is not configured' });
    }

    const { row, token, targetSheet } = req.body;
    const target = targetSheet || 'partners';

    if (!verifyAdminToken(token, ADMIN_PASSWORD)) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    if (!row) {
        return res.status(400).json({ error: 'Row index is required' });
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
        res.json(result);
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

// 404 エラーハンドリング
app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1><p>お探しのページは見つかりませんでした。</p>');
});

app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`  🚀 サーバーが起動しました！`);
    console.log(`  🌐 URL: http://localhost:${PORT}`);
    console.log(`  📂 配信元ディレクトリ: ${__dirname}`);
    console.log(`-----------------------------------------`);
});

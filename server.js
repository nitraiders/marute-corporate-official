const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script URL (環境変数から取得)
const GAS_URL = process.env.GAS_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.use(express.json());

// 静的ファイルの配信ディレクトリを指定
app.use((req, res, next) => {
    res.setHeader('Content-Language', 'ja');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// --- 共通データ API (提携企業 & ニュース) ---

// 1. 取得 API (GET)
// パラメータ ?sheet=... で対象切り替え
app.get('/api/data', async (req, res) => {
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
app.get('/api/partners', (req, res) => res.redirect('/api/data?sheet=partners'));

// 2. 追加 API (POST)
app.post('/api/partners', async (req, res) => {
    const { name, url, content, password, targetSheet } = req.body;
    const target = targetSheet || 'partners';

    if (password !== ADMIN_PASSWORD) {
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
    const { row, password, targetSheet } = req.body;
    const target = targetSheet || 'partners';

    if (password !== ADMIN_PASSWORD) {
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
    console.log(`  📂 配信元ディレクトリ: ${path.join(__dirname, 'public')}`);
    console.log(`-----------------------------------------`);
});

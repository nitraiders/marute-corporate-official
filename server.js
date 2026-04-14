const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyaM3m9MmCQmMRX0HrDyNgGI3ellW0R6X4sHugejNBI9KunzpZs-89fnnhuFIWcZ5Ba2w/exec';
const ADMIN_PASSWORD = 'marute96';

app.use(express.json());

// 静的ファイルの配信ディレクトリを指定
app.use((req, res, next) => {
    res.setHeader('Content-Language', 'ja');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// --- 提携企業 API ---

// 1. 取得 API (GET)
app.get('/api/partners', async (req, res) => {
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        // 追加順（日付昇順）に保持
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        res.json(sortedData);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// 2. 追加 API (POST)
app.post('/api/partners', async (req, res) => {
    const { name, url, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Invalid password' });
    }

    if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
    }

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url })
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Post error:', error);
        res.status(500).json({ error: 'Failed to add partner' });
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

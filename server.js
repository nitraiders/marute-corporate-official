const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 静的ファイルの配信ディレクトリを指定
app.use((req, res, next) => {
    res.setHeader('Content-Language', 'ja');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

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

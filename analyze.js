/**
 * analyze.js
 * ドメインの技術的なステータス（ロック状態）を診断するプログラム
 */
const whois = require('whois');

// 調査対象のドメイン名
const targetDomain = 'marute-96.com';

console.log(`🔎 [診断中] ${targetDomain} の公式データを取得しています...\n`);

whois.lookup(targetDomain, (err, data) => {
    if (err) {
        console.error('❌ 通信エラーが発生しました:', err);
        return;
    }

    // 取得した膨大なテキストデータから「Domain Status」が含まれる行だけを抜き出す
    const statusLines = data.split('\n').filter(line => 
        line.toLowerCase().includes('domain status:')
    );

    if (statusLines.length === 0) {
        console.log('⚠️ ステータスコードが見つかりませんでした。');
    } else {
        console.log('--- 診断結果 ---');
        statusLines.forEach(line => {
            // 余計な空白を取り除いて表示
            const status = line.split(':')[1].trim();
            console.log(`📍 ステータスコード: ${status}`);

            // 代表的なエラーコードの判定
            if (status.includes('clientUpdateProhibited')) {
                console.log('   💡 解説: 【更新ロック】がかかっています。レジストラ側で更新不可に設定されています。');
            }
            if (status.includes('clientTransferProhibited')) {
                console.log('   💡 解説: 【移管ロック】がかかっています。');
            }
            if (status.includes('ok')) {
                console.log('   💡 解説: 【正常】ドメインは正常な状態です。');
            }
        });
    }
    console.log('\n--- 診断完了 ---');
});

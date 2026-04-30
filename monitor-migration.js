/**
 * monitor-migration.js
 * ネームサーバーの切り替えを監視し、反映を通知するプログラム
 */

const dns = require('dns').promises;
const notifier = require('node-notifier');

// 監視設定
const DOMAIN = 'marute-96.com';
const TARGET_NS = 'cloudflare.com'; // Cloudflareのキーワード
const CHECK_INTERVAL = 30000;       // 30秒ごとにチェック

async function checkMigration() {
    console.log(`📡 [監視開始] ${DOMAIN} の移行を見張っています...`);
    console.log(`※ 30秒ごとに確認します。このままお待ちください。\n`);

    const intervalId = setInterval(async () => {
        try {
            // ドメインの現在のネームサーバーを取得
            const nsRecords = await dns.resolveNs(DOMAIN);

            // 取得した名前に 'cloudflare.com' が含まれているか確認
            const isMigrated = nsRecords.some(ns => ns.toLowerCase().includes(TARGET_NS));

            if (isMigrated) {
                console.log("\n✅ 【完了】Cloudflare への切り替えを確認しました！");
                console.log(`現在の設定: ${nsRecords.join(', ')}`);

                // PC画面に通知を表示
                notifier.notify({
                    title: '🌐 ネームサーバー移行完了',
                    message: `${DOMAIN} が Cloudflare に切り替わりました。Renderのプラン変更が可能です。`,
                    sound: true,
                    wait: true
                });

                // プログラムを終了
                clearInterval(intervalId);
                process.exit(0);
            } else {
                // 未反映の場合はドットを表示して継続を知らせる
                process.stdout.write(".");
            }
        } catch (error) {
            // 反映直後などは一時的にエラーになることがありますが継続します
            process.stdout.write("?");
        }
    }, CHECK_INTERVAL);
}

checkMigration();
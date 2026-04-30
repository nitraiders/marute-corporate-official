export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const sheet = searchParams.get('sheet') || 'partners';
    
    // 環境変数またはデフォルト
    const GAS_URL = context.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbyzK8Ylb4-ag6whIYVK7LdkKLtd1vIUwzWm61fLs6ky3dfhBWGUA05a8Lp_nKeCWn4sUQ/exec';
    
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
        
        return new Response(JSON.stringify(sortedData), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

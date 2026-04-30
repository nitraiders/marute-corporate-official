export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const sheet = searchParams.get('sheet') || 'marute_news';
    
    // Cloudflare Pages の環境変数を取得
    const GAS_URL = context.env.GAS_URL;
    
    if (!GAS_URL) {
        return new Response(JSON.stringify({ 
            error: 'Configuration Error', 
            details: 'GAS_URL environment variable is not set in Cloudflare dashboard. Please check your Pages settings.' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const response = await fetch(`${GAS_URL}?sheet=${sheet}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ 
                error: 'GAS Connection Error', 
                details: `Google Apps Script returned status ${response.status}: ${errorText}`
            }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const data = await response.json();
        
        if (data.error) {
            return new Response(JSON.stringify({ 
                error: 'GAS Application Error', 
                details: data.error 
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
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
        return new Response(JSON.stringify({ 
            error: 'Fetch Error', 
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

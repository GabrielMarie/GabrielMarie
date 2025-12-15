// Cloudflare Worker - Logger les IPs avec consentement
// À copier/coller dans: https://dash.cloudflare.com/workers

const LOGS_KEY = 'site_visitor_logs';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Endpoint pour enregistrer une visite
    if (url.pathname === '/api/log-visitor' && request.method === 'POST') {
      try {
        const data = await request.json();
        const { ip, page, timestamp } = data;

        if (!ip || !page) {
          return new Response(JSON.stringify({ error: 'Missing data' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Récupérer les logs existants
        let logs = [];
        try {
          const stored = await LOGS.get(LOGS_KEY);
          if (stored) logs = JSON.parse(stored);
        } catch (e) {
          logs = [];
        }

        // Ajouter la nouvelle visite
        logs.push({
          ip,
          page,
          timestamp: timestamp || new Date().toISOString(),
          userAgent: request.headers.get('user-agent')
        });

        // Garder seulement les 1000 derniers logs
        if (logs.length > 1000) {
          logs = logs.slice(-1000);
        }

        // Sauvegarder
        await LOGS.put(LOGS_KEY, JSON.stringify(logs));

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Endpoint pour récupérer les logs (protégé par token)
    if (url.pathname === '/api/get-logs' && request.method === 'GET') {
      const token = url.searchParams.get('token');
      
      // Token simple (changez-le en quelque chose d'unique)
      const VALID_TOKEN = 'your-secret-token-12345';
      
      if (token !== VALID_TOKEN) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const logs = await LOGS.get(LOGS_KEY);
        return new Response(logs || '[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Page par défaut
    return new Response('Cloudflare Worker running', { status: 200 });
  }
};

// Binding: vous allez créer un KV Namespace nommé "LOGS" dans Cloudflare

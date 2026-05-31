const { getStore } = require('@netlify/blobs');

const BLOB_STORE = 'aws-storage-companies';
const BLOB_KEY = 'data';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...corsHeaders
        },
        body: JSON.stringify(body)
    };
}

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    try {
        const store = getStore({ name: BLOB_STORE, consistency: 'strong' });

        if (event.httpMethod === 'GET') {
            const data = await store.get(BLOB_KEY, { type: 'json' });
            const payload = data || { companies: [], lastActiveId: null, updatedAt: null };
            return jsonResponse(200, {
                ok: true,
                companies: Array.isArray(payload.companies) ? payload.companies : [],
                lastActiveId: payload.lastActiveId || null,
                updatedAt: payload.updatedAt || null
            });
        }

        if (event.httpMethod === 'POST') {
            let body;
            try {
                body = JSON.parse(event.body || '{}');
            } catch {
                return jsonResponse(400, { ok: false, error: 'Invalid JSON body' });
            }

            if (!Array.isArray(body.companies)) {
                return jsonResponse(400, { ok: false, error: 'companies must be an array' });
            }

            const payload = {
                companies: body.companies,
                lastActiveId: body.lastActiveId || null,
                updatedAt: new Date().toISOString()
            };

            await store.setJSON(BLOB_KEY, payload);

            return jsonResponse(200, { ok: true, updatedAt: payload.updatedAt });
        }

        return jsonResponse(405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('companies function error:', err);
        return jsonResponse(500, {
            ok: false,
            error: err.message || 'Server error'
        });
    }
};

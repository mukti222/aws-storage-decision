const DATA_KEY = 'aws_storage_companies_data';
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

function emptyPayload() {
    return { companies: [], lastActiveId: null, updatedAt: null };
}

async function loadFromUpstash() {
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!base || !token) return null;

    const res = await fetch(`${base}/get/${DATA_KEY}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        throw new Error('Upstash GET failed: ' + res.status);
    }
    const json = await res.json();
    if (json.result == null) return emptyPayload();
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
}

async function saveToUpstash(payload) {
    const base = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!base || !token) return false;

    const res = await fetch(`${base}/set/${DATA_KEY}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return res.ok;
}

async function loadFromBlobs() {
    const { getStore } = require('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    const data = await store.get(BLOB_KEY, { type: 'json' });
    return data || emptyPayload();
}

async function saveToBlobs(payload) {
    const { getStore } = require('@netlify/blobs');
    const store = getStore(BLOB_STORE);
    await store.setJSON(BLOB_KEY, payload);
}

async function loadData() {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const data = await loadFromUpstash();
        return { data, mode: 'upstash' };
    }
    const data = await loadFromBlobs();
    return { data, mode: 'blobs' };
}

async function saveData(payload) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const ok = await saveToUpstash(payload);
        if (!ok) throw new Error('Upstash save failed');
        return 'upstash';
    }
    await saveToBlobs(payload);
    return 'blobs';
}

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    try {
        if (event.httpMethod === 'GET') {
            const { data, mode } = await loadData();
            const payload = data || emptyPayload();
            return jsonResponse(200, {
                ok: true,
                mode,
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

            const mode = await saveData(payload);
            return jsonResponse(200, { ok: true, mode, updatedAt: payload.updatedAt });
        }

        return jsonResponse(405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('companies error:', err);
        const hint =
            !process.env.UPSTASH_REDIS_REST_URL
                ? ' Tambah env UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN di Netlify (gratis Upstash).'
                : '';
        return jsonResponse(500, {
            ok: false,
            error: (err.message || 'Server error') + hint
        });
    }
};

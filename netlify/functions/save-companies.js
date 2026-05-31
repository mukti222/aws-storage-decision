const { getStore } = require('@netlify/blobs');
const { jsonResponse, handleOptions } = require('./_shared');

const BLOB_STORE = 'aws-storage-companies';
const BLOB_KEY = 'data';

exports.handler = async function (event) {
    const options = handleOptions(event);
    if (options) return options;

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { ok: false, error: 'Method not allowed' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return jsonResponse(400, { ok: false, error: 'Invalid JSON' });
    }

    if (!Array.isArray(body.companies)) {
        return jsonResponse(400, { ok: false, error: 'companies must be an array' });
    }

    const payload = {
        companies: body.companies,
        lastActiveId: body.lastActiveId || null,
        updatedAt: new Date().toISOString()
    };

    try {
        const store = getStore(BLOB_STORE);
        await store.setJSON(BLOB_KEY, payload);
        return jsonResponse(200, { ok: true, updatedAt: payload.updatedAt });
    } catch (err) {
        console.error('save-companies POST error:', err);
        return jsonResponse(500, { ok: false, error: 'Failed to save store' });
    }
};

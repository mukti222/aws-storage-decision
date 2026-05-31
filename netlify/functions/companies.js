const { getStore } = require('@netlify/blobs');
const { jsonResponse, handleOptions } = require('./_shared');

const BLOB_STORE = 'aws-storage-companies';
const BLOB_KEY = 'data';

exports.handler = async function (event) {
    const options = handleOptions(event);
    if (options) return options;

    if (event.httpMethod !== 'GET') {
        return jsonResponse(405, { ok: false, error: 'Method not allowed' });
    }

    try {
        const store = getStore(BLOB_STORE);
        const data = await store.get(BLOB_KEY, { type: 'json' });
        const payload = data || { companies: [], lastActiveId: null, updatedAt: null };
        return jsonResponse(200, {
            ok: true,
            companies: Array.isArray(payload.companies) ? payload.companies : [],
            lastActiveId: payload.lastActiveId || null,
            updatedAt: payload.updatedAt || null
        });
    } catch (err) {
        console.error('companies GET error:', err);
        return jsonResponse(500, { ok: false, error: 'Failed to read store' });
    }
};

const fetchFn = global.fetch;

let cachedToken = null;
let tokenExpiresAt = null;

async function getManagementToken() {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    if (!fetchFn) {
        throw new Error('Global fetch is not available. Run on Node 18+ or provide a fetch polyfill.');
    }

    const response = await fetchFn(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.AUTH0_MGMT_CLIENT_ID,
            client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
            audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Auth0 token request failed: ${response.status} ${body}`);
    }

    const { access_token, expires_in } = await response.json();
    if (!access_token || !expires_in) {
        throw new Error('Invalid token response from Auth0');
    }

    cachedToken = access_token;
    tokenExpiresAt = Date.now() + expires_in * 1000;

    return cachedToken;
}

async function deleteAuth0User(auth0UserId) {
    const token = await getManagementToken();

    if (!fetchFn) {
        throw new Error('Global fetch is not available. Run on Node 18+ or provide a fetch polyfill.');
    }

    const response = await fetchFn(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0UserId)}`,
        {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        }
    );

    // Treat 204 No Content and 404 Not Found as OK for idempotency
    if (response.status === 204 || response.status === 404) {
        return;
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Failed to delete Auth0 user: ${response.status} ${body}`);
    }
}

module.exports = { deleteAuth0User };
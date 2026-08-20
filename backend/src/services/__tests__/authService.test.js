describe('authService', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
        process.env.AUTH0_DOMAIN = 'example.auth0.com';
        process.env.AUTH0_MGMT_CLIENT_ID = 'cid';
        process.env.AUTH0_MGMT_CLIENT_SECRET = 'secret';
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    test('deleteAuth0User fetches token then deletes user', async () => {
        const fetchMock = jest.fn()
            // token
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'tok', expires_in: 3600 }),
            })
            // delete
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
                text: async () => '',
            });

        global.fetch = fetchMock;

        const { deleteAuth0User } = require('../authService');

        await deleteAuth0User('auth0|abc');

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][0]).toContain('/oauth/token');
        expect(fetchMock.mock.calls[1][0]).toContain('/api/v2/users/');
        expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer tok');
    });

    test('deleteAuth0User treats 404 as success (idempotent)', async () => {
        const fetchMock = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'tok', expires_in: 3600 }),
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => 'not found',
            });

        global.fetch = fetchMock;

        const { deleteAuth0User } = require('../authService');

        await expect(deleteAuth0User('auth0|missing')).resolves.toBeUndefined();
    });

    test('deleteAuth0User throws when token request fails', async () => {
        const fetchMock = jest.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => 'bad',
        });

        global.fetch = fetchMock;

        const { deleteAuth0User } = require('../authService');

        await expect(deleteAuth0User('auth0|abc')).rejects.toThrow(/Auth0 token request failed/);
    });

    test('deleteAuth0User reuses cached token to avoid extra token request', async () => {
        const fetchMock = jest.fn()
            // first call token
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ access_token: 'tok', expires_in: 3600 }),
            })
            // first delete
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
                text: async () => '',
            })
            // second delete
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
                text: async () => '',
            });

        global.fetch = fetchMock;

        const { deleteAuth0User } = require('../authService');

        await deleteAuth0User('auth0|u1');
        await deleteAuth0User('auth0|u2');

        // Only 1 token request total
        const tokenCalls = fetchMock.mock.calls.filter(c => String(c[0]).includes('/oauth/token'));
        expect(tokenCalls).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});

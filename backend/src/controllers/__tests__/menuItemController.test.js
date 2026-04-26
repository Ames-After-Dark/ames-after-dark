jest.mock('../../services/menuItemService');
jest.mock('../../services/userService');

const menuItemService = require('../../services/menuItemService');
const userService = require('../../services/userService');
const menuItemController = require('../menuItemController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('menuItemController authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createMenuItem', () => {
    it('returns 401 if no auth', async () => {
      const req = { body: { location_id: 1, name: 'Test' }, auth: undefined };
      const res = createRes();

      await menuItemController.createMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(menuItemService.createMenuItem).not.toHaveBeenCalled();
    });

    it('returns 403 if admin not for location', async () => {
      const req = {
        body: { location_id: 1, name: 'Test' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 99 }]
      });

      await menuItemController.createMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuItemService.createMenuItem).not.toHaveBeenCalled();
    });

    it('returns 201 if developer', async () => {
      const req = {
        body: { location_id: 1, name: 'Test' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'developer' },
        location_admins: []
      });
      menuItemService.createMenuItem.mockResolvedValue({ id: 1 });

      await menuItemController.createMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(menuItemService.createMenuItem).toHaveBeenCalledWith(req.body);
    });
  });

  describe('updateMenuItem', () => {
    it('returns 403 if admin not for existing location', async () => {
      const req = {
        params: { id: '10' },
        body: { name: 'Updated' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      menuItemService.getMenuItemById.mockResolvedValue({ id: 10, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 99 }]
      });

      await menuItemController.updateMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuItemService.updateMenuItem).not.toHaveBeenCalled();
    });

    it('returns 200 if admin for existing location', async () => {
      const req = {
        params: { id: '10' },
        body: { name: 'Updated' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      menuItemService.getMenuItemById.mockResolvedValue({ id: 10, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 5 }]
      });
      menuItemService.updateMenuItem.mockResolvedValue({ id: 10, name: 'Updated' });

      await menuItemController.updateMenuItem(req, res);

      expect(res.json).toHaveBeenCalledWith({ id: 10, name: 'Updated' });
      expect(menuItemService.updateMenuItem).toHaveBeenCalledWith(10, req.body);
    });
  });

  describe('deleteMenuItem', () => {
    it('returns 204 if developer', async () => {
      const req = {
        params: { id: '10' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      menuItemService.getMenuItemById.mockResolvedValue({ id: 10, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'developer' },
        location_admins: []
      });
      menuItemService.deleteMenuItem.mockResolvedValue({});

      await menuItemController.deleteMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(menuItemService.deleteMenuItem).toHaveBeenCalledWith(10);
    });

    it('returns 404 if menu item not found', async () => {
      const req = {
        params: { id: '10' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      menuItemService.getMenuItemById.mockResolvedValue(null);

      await menuItemController.deleteMenuItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(menuItemService.deleteMenuItem).not.toHaveBeenCalled();
    });
  });

  describe('createMenuItemType', () => {
    it('returns 403 if not developer', async () => {
      const req = {
        body: { name: 'Appetizers' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: []
      });

      await menuItemController.createMenuItemType(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(menuItemService.createMenuItemType).not.toHaveBeenCalled();
    });

    it('returns 201 if developer', async () => {
      const req = {
        body: { name: 'Appetizers' },
        auth: { payload: { sub: 'auth0|abc' } }
      };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'developer' },
        location_admins: []
      });
      menuItemService.createMenuItemType.mockResolvedValue({ id: 1, name: 'Appetizers' });

      await menuItemController.createMenuItemType(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(menuItemService.createMenuItemType).toHaveBeenCalledWith(req.body);
    });
  });
});

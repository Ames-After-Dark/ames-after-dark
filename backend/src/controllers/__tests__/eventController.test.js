jest.mock('../../services/eventService', () => ({
  getEvents: jest.fn(),
  getEventById: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

jest.mock('../../services/userService');

const eventService = require('../../services/eventService');
const userService = require('../../services/userService');
const eventController = require('../eventController');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('eventController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getEvents returns JSON list', async () => {
    const sample = [{ id: 1 }];
    eventService.getEvents.mockResolvedValue(sample);

    const res = createRes();
    await eventController.getEvents({}, res);

    expect(eventService.getEvents).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getEventById handles invalid id with 400', async () => {
    const req = { params: { id: 'nope' } };
    const res = createRes();

    await eventController.getEventById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getEventById returns 404 when not found', async () => {
    eventService.getEventById.mockResolvedValue(null);
    const req = { params: { id: '7' } };
    const res = createRes();

    await eventController.getEventById(req, res);

    expect(eventService.getEventById).toHaveBeenCalledWith(7);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Event not found' });
  });

  describe('createEvent', () => {
    it('returns 401 if unauthenticated', async () => {
      const req = { auth: null, body: { location_id: 1, name: 'Live Music' } };
      const res = createRes();

      await eventController.createEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 if authenticated but lacking permissions', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Live Music' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'user' },
        location_admins: []
      });

      await eventController.createEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 if admin but not for the specific location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Live Music' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] 
      });

      await eventController.createEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 201 if successful as admin for location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Live Music' } };
      const res = createRes();
      const mockResult = { id: 1, name: 'Live Music' };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 1 }] 
      });
      eventService.createEvent.mockResolvedValue(mockResult);

      await eventController.createEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('updateEvent', () => {
    it('returns 403 if admin lacks permission for event location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, params: { id: '1' }, body: { name: 'Updated' } };
      const res = createRes();

      eventService.getEventById.mockResolvedValue({ id: 1, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] 
      });

      await eventController.updateEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteEvent', () => {
    it('returns 403 if admin lacks permission for event location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, params: { id: '1' } };
      const res = createRes();

      eventService.getEventById.mockResolvedValue({ id: 1, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] 
      });

      await eventController.deleteEvent(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

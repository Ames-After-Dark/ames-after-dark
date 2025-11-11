jest.mock('../../services/eventService', () => ({
  getEvents: jest.fn(),
  getEventById: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

const eventService = require('../../services/eventService');
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
});

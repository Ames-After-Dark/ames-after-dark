jest.mock('../../services/locationService', () => ({
  getLocations: jest.fn(),
  getLocationById: jest.fn(),
  createLocation: jest.fn(),
  updateLocation: jest.fn(),
  deleteLocation: jest.fn(),
}));

const locationService = require('../../services/locationService');
const locationController = require('../locationController');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('locationController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getLocations returns JSON list', async () => {
    const sample = [{ id: 1 }];
    locationService.getLocations.mockResolvedValue(sample);

    const res = createRes();
    await locationController.getLocations({}, res);

    expect(locationService.getLocations).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getLocationById handles invalid id with 400', async () => {
    const req = { params: { id: 'x' } };
    const res = createRes();

    await locationController.getLocationById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getLocationById returns 404 when not found', async () => {
    locationService.getLocationById.mockResolvedValue(null);
    const req = { params: { id: '9' } };
    const res = createRes();

    await locationController.getLocationById(req, res);

    expect(locationService.getLocationById).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });
});

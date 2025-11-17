jest.mock('../../services/dealService', () => ({
  getDeals: jest.fn(),
  getDealById: jest.fn(),
  createDeal: jest.fn(),
  updateDeal: jest.fn(),
  deleteDeal: jest.fn(),
}));

const dealService = require('../../services/dealService');
const dealController = require('../dealController');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('dealController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getDeals returns JSON list', async () => {
    const sample = [{ id: 1 }];
    dealService.getDeals.mockResolvedValue(sample);

    const res = createRes();
    await dealController.getDeals({}, res);

    expect(dealService.getDeals).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getDealById handles invalid id with 400', async () => {
    const req = { params: { id: 'abc' } };
    const res = createRes();

    await dealController.getDealById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getDealById returns 404 when not found', async () => {
    dealService.getDealById.mockResolvedValue(null);
    const req = { params: { id: '5' } };
    const res = createRes();

    await dealController.getDealById(req, res);

    expect(dealService.getDealById).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Deal not found' });
  });
});

jest.mock('../../services/userService', () => ({
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

const userService = require('../../services/userService');
const userController = require('../userController');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('userController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getUsers returns JSON list', async () => {
    const sample = [{ id: 1 }];
    userService.getUsers.mockResolvedValue(sample);

    const res = createRes();
    await userController.getUsers({}, res);

    expect(userService.getUsers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getUserById handles invalid id with 400', async () => {
    const req = { params: { id: 'bad' } };
    const res = createRes();

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getUserById returns 404 when not found', async () => {
    userService.getUserById.mockResolvedValue(null);
    const req = { params: { id: '3' } };
    const res = createRes();

    await userController.getUserById(req, res);

    expect(userService.getUserById).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
});

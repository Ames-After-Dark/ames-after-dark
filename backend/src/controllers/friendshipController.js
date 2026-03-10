const friendshipService = require('../services/friendshipService');

exports.getFriends = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
  try {
    const friends = await friendshipService.getFriends(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.sendFriendRequest = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(userId) || isNaN(friendId)) return res.status(400).json({ message: 'Invalid userId or friendId' });
  try {
    const request = await friendshipService.sendFriendRequest(userId, friendId);
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(userId) || isNaN(friendId)) return res.status(400).json({ message: 'Invalid userId or friendId' });
  try {
    const result = await friendshipService.acceptFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.declineFriendRequest = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(userId) || isNaN(friendId)) return res.status(400).json({ message: 'Invalid userId or friendId' });
  try {
    const result = await friendshipService.declineFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.blockFriend = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(userId) || isNaN(friendId)) return res.status(400).json({ message: 'Invalid userId or friendId' });
  try {
    const result = await friendshipService.blockFriend(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeFriend = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(userId) || isNaN(friendId)) return res.status(400).json({ message: 'Invalid userId or friendId' });
  try {
    await friendshipService.removeFriend(userId, friendId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPendingRequests = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
  try {
    const requests = await friendshipService.getPendingRequests(userId);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFriendsLocations = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
  try {
    const locations = await friendshipService.getFriendsLocations(userId);
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRecommendedFriends = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: 'Invalid userId' });
  try {
    const recommendations = await friendshipService.getRecommendedFriends(userId);
    res.json(recommendations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


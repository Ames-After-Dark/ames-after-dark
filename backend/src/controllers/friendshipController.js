const friendshipService = require('../services/friendshipService');
const userService = require('../services/userService');

exports.getFriends = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friends = await friendshipService.getFriends(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });
    const request = await friendshipService.sendFriendRequest(userId, friendId);
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });
    const result = await friendshipService.acceptFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.declineFriendRequest = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });
    const result = await friendshipService.declineFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.blockFriend = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });
    const result = await friendshipService.blockFriend(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const friendId = parseInt(req.params.friendId, 10);
    if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });
    await friendshipService.removeFriend(userId, friendId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const requests = await friendshipService.getPendingRequests(userId);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRecommendedFriends = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
    if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userId = user.id;

    const limit = parseInt(req.query.limit, 10) || 10;

    const recommendations = await friendshipService.getRecommendedFriends(userId, limit);

    // Flatten the response to return just user objects with mutualCount
    const flattened = recommendations.map(rec => ({
      ...rec.user,
      mutualCount: rec.mutualCount,
    }));

    res.json(flattened);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


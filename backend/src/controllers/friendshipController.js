const friendshipService = require('../services/friendshipService');
const userService = require('../services/userService');

exports.getFriends = async (req, res) => {
  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    const friends = await friendshipService.getFriends(userId);
    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMutualFriends = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Verify person exists
    const person = await userService.getUserById(friendId);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    // Fetch both friend lists
    const [viewerFriends, profileFriends] = await Promise.all([
      friendshipService.getFriends(userId),
      friendshipService.getFriends(friendId)
    ]);

    // Compute mutuals in memory
    const viewerFriendIds = new Set(viewerFriends.map(f => f.id));
    const mutualFriends = profileFriends.filter(f => viewerFriendIds.has(f.id));

    res.json(mutualFriends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getFriendsOfFriend = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    const person = await userService.getUserById(friendId);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    const friendsOfFriend = await friendshipService.getFriendsOfFriend(userId, friendId);
    res.json(friendsOfFriend);
  } catch (err) {
    console.error(err);
    if (err.message === 'Not friends') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.sendFriendRequest = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Cannot send request to self
    if (userId === friendId) return res.status(400).json({ message: 'Cannot send request to self' });

    // Verify person exists
    const person = await userService.getUserById(friendId);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    const request = await friendshipService.sendFriendRequest(userId, friendId);
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Verify friend exists
    const friend = await userService.getUserById(friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });

    const result = await friendshipService.acceptFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.declineFriendRequest = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Verify friend exists
    const friend = await userService.getUserById(friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });

    const result = await friendshipService.declineFriendRequest(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.blockFriend = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Verify friend exists
    const friend = await userService.getUserById(friendId);
    if (!friend) return res.status(404).json({ message: 'Friend not found' });

    const result = await friendshipService.blockFriend(userId, friendId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeFriend = async (req, res) => {
  const friendId = parseInt(req.params.friendId, 10);
  if (isNaN(friendId)) return res.status(400).json({ message: 'Invalid friendId' });

  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    // Verify person exists
    const person = await userService.getUserById(friendId);
    if (!person) return res.status(404).json({ message: 'Person not found' });

    await friendshipService.removeFriend(userId, friendId);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPendingRequests = async (req, res) => {
  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

    const requests = await friendshipService.getPendingRequests(userId);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRecommendedFriends = async (req, res) => {
  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) return res.status(401).json({ message: 'Unauthorized' });

  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const user = await userService.getUserByAuth0Id(auth0Id);
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    const userId = user.id;

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


//routes/portal.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// DEMO AUTH MIDDLEWARE
// ============================================
// Simulates a logged-in bar owner
// In production, replace with Auth0 or your auth solution
const demoAuth = (req, res, next) => {
  // For demo: hardcode a user who owns location_id = 1
  // In production, this would come from your auth token/session
  req.user = {
    id: 1,
    location_id: 1, // This bar owner manages location with id=1
    username: 'demo_owner'
  };
  next();
};

// Apply demo auth to all portal routes
router.use(demoAuth);

// ============================================
// GET LOCATION DATA (Dashboard)
// ============================================
router.get('/dashboard', async (req, res) => {
  try {
    const locationId = req.user.location_id;

    // Fetch location details
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      include: {
        location_hours: {
          include: {
            weekdays: true
          },
          orderBy: {
            weekday_id: 'asc'
          }
        },
        deals: {
          include: {
            weekdays: true
          },
          where: {
            repeating: true // Only get repeating weekly deals
          },
          orderBy: {
            weekday_id: 'asc'
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Format hours data for frontend
    const hoursFormatted = {};
    location.location_hours.forEach(hour => {
      const dayName = hour.weekdays?.name || 'Unknown';
      if (hour.is_open) {
        const openTime = new Date(hour.open_time_).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const closeTime = new Date(hour.close_time).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        hoursFormatted[dayName] = `${openTime} - ${closeTime}`;
      } else {
        hoursFormatted[dayName] = 'Closed';
      }
    });

    // Format deals data for frontend
    const dealsFormatted = {};
    location.deals.forEach(deal => {
      const dayName = deal.weekdays?.name || 'Unknown';
      dealsFormatted[dayName] = deal.name || 'No deal';
    });

    // Build response
    const dashboardData = {
      name: location.name,
      nickname: location.nickname,
      description: location.description,
      address: location.address,
      hours: hoursFormatted,
      deals: dealsFormatted,
      views: location.views || 0,
      tags: location.tags || [],
      isOpen: location.open
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

// ============================================
// GET HOURS (for editing)
// ============================================
router.get('/hours', async (req, res) => {
  try {
    const locationId = req.user.location_id;

    const hours = await prisma.location_hours.findMany({
      where: { location_id: locationId },
      include: {
        weekdays: true
      },
      orderBy: {
        weekday_id: 'asc'
      }
    });

    // Format for editing
    const hoursData = hours.map(hour => ({
      id: hour.id,
      weekday: hour.weekdays?.name || 'Unknown',
      weekday_id: hour.weekday_id,
      is_open: hour.is_open,
      open_time: hour.is_open ? new Date(hour.open_time_).toTimeString().slice(0, 5) : '',
      close_time: hour.is_open ? new Date(hour.close_time).toTimeString().slice(0, 5) : ''
    }));

    res.json(hoursData);
  } catch (error) {
    console.error('Error fetching hours:', error);
    res.status(500).json({ error: 'Failed to fetch hours' });
  }
});

// ============================================
// UPDATE HOURS
// ============================================
router.put('/hours/:hourId', async (req, res) => {
  try {
    const { hourId } = req.params;
    const { is_open, open_time, close_time } = req.body;
    const locationId = req.user.location_id;

    // Verify this hour belongs to the user's location
    const existingHour = await prisma.location_hours.findFirst({
      where: {
        id: parseInt(hourId),
        location_id: locationId
      }
    });

    if (!existingHour) {
      return res.status(403).json({ error: 'Unauthorized or hour not found' });
    }

    // Validation
    if (is_open && (!open_time || !close_time)) {
      return res.status(400).json({ error: 'Open and close times required when open' });
    }

    // Convert time strings to timestamps (use arbitrary date)
    const baseDate = '2024-01-01';
    const openTimestamp = is_open ? new Date(`${baseDate}T${open_time}:00`) : null;
    const closeTimestamp = is_open ? new Date(`${baseDate}T${close_time}:00`) : null;

    // Update hour
    const updatedHour = await prisma.location_hours.update({
      where: { id: parseInt(hourId) },
      data: {
        is_open: is_open,
        open_time_: openTimestamp,
        close_time: closeTimestamp
      }
    });

    res.json({ message: 'Hours updated successfully', data: updatedHour });
  } catch (error) {
    console.error('Error updating hours:', error);
    res.status(500).json({ error: 'Failed to update hours' });
  }
});

// ============================================
// GET DEALS (for editing)
// ============================================
router.get('/deals', async (req, res) => {
  try {
    const locationId = req.user.location_id;

    const deals = await prisma.deals.findMany({
      where: { 
        location_id: locationId,
        repeating: true // Only weekly repeating deals
      },
      include: {
        weekdays: true
      },
      orderBy: {
        weekday_id: 'asc'
      }
    });

    // Format for editing
    const dealsData = deals.map(deal => ({
      id: deal.id,
      weekday: deal.weekdays?.name || 'Unknown',
      weekday_id: deal.weekday_id,
      name: deal.name || '',
      start_time: deal.start_time || '',
      end_time: deal.end_time || ''
    }));

    res.json(dealsData);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// ============================================
// UPDATE DEAL
// ============================================
router.put('/deals/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { name, start_time, end_time } = req.body;
    const locationId = req.user.location_id;

    // Verify this deal belongs to the user's location
    const existingDeal = await prisma.deals.findFirst({
      where: {
        id: parseInt(dealId),
        location_id: locationId
      }
    });

    if (!existingDeal) {
      return res.status(403).json({ error: 'Unauthorized or deal not found' });
    }

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Deal name is required' });
    }

    if (name.length > 255) {
      return res.status(400).json({ error: 'Deal name too long (max 255 characters)' });
    }

    // Update deal
    const updatedDeal = await prisma.deals.update({
      where: { id: parseInt(dealId) },
      data: {
        name: name.trim(),
        start_time: start_time || null,
        end_time: end_time || null
      }
    });

    res.json({ message: 'Deal updated successfully', data: updatedDeal });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// ============================================
// UPDATE LOCATION INFO (description, etc)
// ============================================
router.put('/location', async (req, res) => {
  try {
    const { description, nickname, tags } = req.body;
    const locationId = req.user.location_id;

    // Validation
    const updates = {};
    
    if (description !== undefined) {
      if (description.length > 500) {
        return res.status(400).json({ error: 'Description too long (max 500 characters)' });
      }
      updates.description = description.trim();
    }

    if (nickname !== undefined) {
      if (nickname.length > 100) {
        return res.status(400).json({ error: 'Nickname too long (max 100 characters)' });
      }
      updates.nickname = nickname.trim();
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: 'Tags must be an array' });
      }
      updates.tags = tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Update location
    const updatedLocation = await prisma.locations.update({
      where: { id: locationId },
      data: updates
    });

    res.json({ message: 'Location updated successfully', data: updatedLocation });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

console.log('Portal.js - router type:', typeof router);
console.log('Portal.js - router is function:', typeof router === 'function');
module.exports = router;

// USAGE IN YOUR MAIN SERVER FILE:
// ============================================
// const portalRoutes = require('./routes/portal');
// app.use(portalRoutes);
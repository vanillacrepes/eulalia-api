const db = require('../database'); // gets the same database connection as database.js
const express = require('express');
const router = express.Router();

// my beloved helpers I love helpers
const prepared = {
  getUser: db.prepare('SELECT * FROM users WHERE user_id = ?'),
  insertUser: db.prepare('INSERT INTO users (user_id, created_at) VALUES (?, ?)'),
  getWater: db.prepare('SELECT * FROM water WHERE user_id = ?'),
  insertWater: db.prepare(`
    INSERT INTO water (user_id, last_drank, drinks_today, active, last_reset)
    VALUES (?, ?, 1, 1, ?)  
  `),
  updateDrank: db.prepare(`
    UPDATE water
    SET last_drank = ?, drinks_today = ?, last_reset = ?
    WHERE user_id = ?
  `),
  updateActive: db.prepare(`
    UPDATE water
    SET active = ?
    WHERE user_id = ?
  `)
};

function isNewDay(lastReset) {
  const toDay = (ms) => Math.floor(ms / (24*60*60*1000));
  return toDay(Date.now()) > toDay(lastReset);
}

function ensureUserDataExists(userId, now) {
  const user = prepared.getUser.get(userId);

  var returnState = 0

  if (!user) {
    prepared.insertUser.run(userId, now); 
    returnState = 1;
  }
  
  const water = prepared.getWater.get(userId);
  if(!water) {
    prepared.insertWater.run(userId, now, now);
    returnState = 2;
  }

  return returnState;
}
//helpers - end

// GET /:userId
router.get('/:userId', (req, res) => {
  const { userId } = req.params; 
  const now = Date.now();

  const dataStatus = ensureUserDataExists(userId, now);

  const userWaterData = prepared.getWater.get(userId);

  res.json(userWaterData);
})

// POST /:userId/drank
router.post('/:userId/drank', (req, res) => {
  const { userId } = req.params; 
  const now = Date.now();

  const dataStatus = ensureUserDataExists(userId, now);

  if(dataStatus == 2) {
    return res.json({message: `Started tracking ${userId}! :D`, drinks_today: 1});
  }

  const water = prepared.getWater.get(userId);
  const drinks = isNewDay(water.last_reset) ? 1 : water.drinks_today + 1;
  const resetDay = isNewDay(water.last_reset) ? now : water.last_reset;

  prepared.updateDrank.run(now, drinks, resetDay, userId);

  res.json({ message: 'Drink logged!', drinks_today: drinks});
});

// PATCH /:userId/active
router.patch('/:userId/active', (req, res) => {
  const { userId } = req.params; 
  const now = Date.now();

  const dataStatus = ensureUserDataExists(userId, now);

  const activeStatus = prepared.getWater.get(userId).active;

  const newActiveStatus = activeStatus == 1 ? 0 : 1;
  const message = activeStatus == 1 ? 'inactive' : 'active';

  prepared.updateActive.run(newActiveStatus, userId);

  res.json({ message: message, active: newActiveStatus});
})

module.exports = router;
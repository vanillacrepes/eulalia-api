const db = require('../database'); // gets the same database connection as database.js
const express = require('express');
const router = express.Router();

// imma be so fr I watched youtube for this

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
  `)
};

// helper for daily reset
function isNewDay(lastReset) {
  const toDay = (ms) => Math.floor(ms / (24*60*60*1000));
  return toDay(Date.now()) > toDay(lastReset);
}

// POST /:userId/drank
router.post('/:userId/drank', (req, res) => {
  const { userId } = req.params;
  const now = Date.now();

  const user = prepared.getUser.get(userId);
  if (!user) prepared.insertUser.run(userId, now);

  const water = prepared.getWater.get(userId);
  if(!water) {
    prepared.insertWater.run(userId, now, now);
    return res.json({message: `Started tracking ${userId}! :D`, drinks_today: 1});
  }

  const drinks = isNewDay(water.last_reset) ? 1 : water.drinks_today + 1;
  const resetDay = isNewDay(water.lastReset) ? now : water.last_reset;

  prepared.updateDrank.run(now, drinks, resetDay, userId);

  res.json({ message: 'Drink logged!', drinks_today: drinks});
});

module.exports = router;
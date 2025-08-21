const express = require('express');
const axios = require('axios');

const router = express.Router();

const FLASK_URL = 'http://localhost:5000';

// Verify Flask is running
async function checkFlaskHealth() {
  try {
    await axios.get(`${FLASK_URL}/health`, { timeout: 1000 });
    return true;
  } catch (error) {
    console.error('Flask health check failed:', error.message);
    return false;
  }
}

router.get('/start', async (req, res) => {
  const isFlaskRunning = await checkFlaskHealth();
  if (isFlaskRunning) {
    return res.json({ status: 'running', url: 'http://localhost:5000' });
  }
  res.status(503).json({ error: 'service is not available' });
});

module.exports = router;
function calculateLevel(xp) {
  return Math.floor(xp / 500) + 1;
}

module.exports = { calculateLevel };

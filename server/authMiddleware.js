const passport = require('passport');

function ensureUser(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
}

const authMiddleware = {
  requireSession: function requireSessionBuilder() {
    return [passport.authenticate('session'), ensureUser];
  }
};

module.exports = authMiddleware;

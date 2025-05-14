import { Router } from 'express';
import { getGoalsByUser, upsertGoals } from '../data/goals.js';

const router = Router();

// ensure user is authenticated
function requireLogin(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    next();
  }
  
  // normalize the userId out of session
  function extractUserId(sessionUser) {
    const raw = sessionUser._id || sessionUser.id || sessionUser.userId;
    if (!raw) throw new Error('No valid user identifier in session');
    return raw.toString();
}

router.get('/', requireLogin, async (req, res, next) => {
    try {
      const existing = await getGoalsByUser(req.session.user);
      res.render('goalTracker', {
        title:    'Goal Tracker',
        loggedIn: true,
        goals:    existing || {}
      });
    } catch (err) {
      next(err);
    }
}); 

router.post('/', requireLogin, async (req, res, next) => {
    try {
      // upsertGoals will validate, compute BMI, maintenance, and save
      const updated = await upsertGoals(req.session.user, req.body);
      // redirect back to GET view
      res.redirect('/goals');
    } catch (err) {
      // on error, re-render form with submitted values and error message
      res.status(400).render('goalTracker', {
        title:    'Goal Tracker',
        loggedIn: true,
        error:    err.message,
        goals:    req.body
      });
    }
});

export default router;
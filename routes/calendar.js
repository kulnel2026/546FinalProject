import { Router } from 'express';
const router = Router();

router.route('/').get(async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: 'You must be logged in to view your calendar.'
      });
    }

    res.render('calendar', {
      title: 'Your Calendar',
      loggedIn: true
    });
  } catch (e) {
    res.status(500).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});

export default router;

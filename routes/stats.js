import { Router } from 'express';
const router = Router();
import { getWorkoutStatsForUser} from '../data/stats.js';

router.get('/', async (req, res) => {
  const userId = req.session.user.userId;

  try {
    const workoutStats = await getWorkoutStatsForUser(userId);

    console.log(workoutStats);

    
    res.render('stats', {
      title: 'Your Workout Stats',
      workoutStats
    });
  } catch (e) {
    res.status(500).render('error', { message: e });
  }
});

export default router;
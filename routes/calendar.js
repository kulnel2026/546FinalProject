import { Router } from 'express';
import {getAllWorkouts, getWorkoutById} from '../data/workouts.js';
import { createEntry } from '../data/calendarEntries.js';

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

router.get('/selectWorkout', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).render('error', { error: 'Login required.' });
  }

  const { date } = req.query;
  const username = req.session.user.userId;
  try{
  // Fetch saved workouts for this user
  const saved = await getAllWorkouts(username); // assuming it filters by user

  res.render('selectWorkout', {
    title: `Add Workout to ${date}`,
    date,
    savedWorkouts: saved,
    loggedIn: true
  });
  }catch(e){
    return res.status(500).render('error', {
      title: 'Error fetching workouts',
      error: e.toString()});
  }
});


router.post('/assignWorkout', async (req, res) => {

  try {
    if (!req.session.user) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: 'You must be logged in to assign a workout.'
      });
    }

    const userId = req.session.user.userId;
    const { workoutId, date } = req.body;

    if (!workoutId || !date) {
      return res.status(400).render('error', {
        title: 'Missing Data',
        error: 'Workout ID and date are required.'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).render('error', {
        title: 'Invalid Date',
        error: 'Date must be in YYYY-MM-DD format.'
      });
    }

    const workout = await getWorkoutById(workoutId);

    if (!workout || !Array.isArray(workout.exercises)) {
      return res.status(404).render('error', {
        title: 'Workout Not Found',
        error: 'Workout does not exist or has no exercises.'
      });
    }

    const formattedWorkouts = workout.exercises.map((ex) => ({
      name: String(ex.name).trim(),
      sets: String(ex.sets).trim(),
      reps: String(ex.reps).trim(),
      weight: String(ex.weight).trim()
    }));

    // Add workout to calendar entry (meals = [])
    await createEntry(userId, date.trim(), formattedWorkouts, []);

    return res.redirect('/calendar');
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Assignment Error',
      error: e.toString()
    });
  }
});


export default router;

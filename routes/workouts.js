import { Router } from 'express';
import { createWorkout, getAllWorkouts, getWorkoutById } from '../data/workouts.js';

const router = Router();

router.get('/', async (req, res) => {
  const all = await getAllWorkouts();
  res.render('workoutList', { workouts: all });
});

router.get('/form', async (req, res) => {
  res.render('workoutForm');
});

router.post('/add', async (req, res) => {
  try {
    const { username, group, time, exercises } = req.body;
    const parsedExercises = JSON.parse(exercises); // expects array of exercise objects
    await createWorkout(username, group, time, parsedExercises);
    res.redirect('/workouts');
  } catch (e) {
    res.status(400).send(e);
  }
});

export default router;

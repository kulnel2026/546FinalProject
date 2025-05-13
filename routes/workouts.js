import { Router } from 'express';
import { createWorkout, getAllWorkouts, getWorkoutById, deleteWorkoutById, updateWorkout } from '../data/workouts.js';

const router = Router();

router.get('/', async (req, res) => {
  const all = await getAllWorkouts();
  res.render('workoutDashboard', { workouts: all });
});

router.get('/form', async (req, res) => {
  res.render('workoutForm', {isEdit: false});
});

router.get('/edit/:id', async (req, res) => {
  try {
    const workout = await getWorkoutById(req.params.id);
    if (!workout) return res.status(404).send('Workout not found');
    res.render('workoutForm', { workout, isEdit: true });
  } catch (e) {
    res.status(500).send(e);
  }
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

router.post('/edit/:id', async (req, res) => {
  try {
    const { username, group, time, exercises } = req.body;
    const parsedExercises = JSON.parse(exercises);
    await updateWorkout(req.params.id, { username, group, time, exercises: parsedExercises });
    res.redirect('/workouts');
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/delete/:id', async (req, res) => {
  try {
    await deleteWorkoutById(req.params.id);
    res.redirect('/workouts');
  } catch (e) {
    res.status(400).send(e);
  }
});

export default router;

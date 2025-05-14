import { Router } from 'express';
import { createWorkout, getAllWorkouts, getWorkoutById, deleteWorkoutById, updateWorkout } from '../data/workouts.js';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.user.userId;
  const all = await getAllWorkouts(username.trim());
  res.render('workoutDashboard', { workouts: all });
});

router.get('/list', async (req, res) => {
  try {
    const username = req.session.user.userId;
    const workouts = await getAllWorkouts(username.trim());
    const isDelete = req.query.action === 'delete';
    res.render('workoutList', { workouts, isDelete });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/form', async (req, res) => {

  const muscleGroups = [
    'Push', 'Pull', 'Legs', 'Chest', 'Triceps', 'Shoulders', 'Upper Back', 'Lats', 'Biceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio'
  ];

  res.render('workoutForm', {isEdit: false, groups: muscleGroups});
});

router.get('/edit/:id', async (req, res) => {
  try {
    const workout = await getWorkoutById(req.params.id);
    if (!workout) return res.status(404).send('Workout not found');

    const muscleGroups = [
      'Push', 'Pull', 'Legs', 'Chest', 'Triceps', 'Shoulders', 'Upper Back', 'Lats', 'Biceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio'
    ];
    res.render('workoutForm', { workout, isEdit: true, groups: muscleGroups});
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/add', async (req, res) => {
  try {
    const username = req.session.user.userId;

    const { exerciseName, exerciseSets, exerciseReps, exerciseWeight, group, time } = req.body;
    
    

    const exercises = Array.isArray(exerciseName) ? exerciseName.map((name, i) => ({
      name: name.trim(),
      sets: Number(exerciseSets[i]),
      reps: Number(exerciseReps[i]),
      weight: Number(exerciseWeight[i])
    })) : [{
      name: exerciseName.trim(),
      sets: Number(exerciseSets),
      reps: Number(exerciseReps),
      weight: Number(exerciseWeight)
    }];


    for (let exercise of exercises){

      if (typeof exerciseName != "string"){
        throw new Error('Exercise name has to be a string');
      }

      if (
        exercise.sets < 0 ||
        exercise.reps < 0 ||
        exercise.weight < 0
      ) {
        throw new Error('Exercise fields cannot be negative');
      }
    }

    //const parsedExercises = JSON.parse(exercises); // expects array of exercise objects
    await createWorkout(username.trim(), group.trim(), time.trim(), exercises);
    res.redirect('/workouts');
  } catch (e) {
    res.status(500).render('error', { message: e });

  }
});

router.post('/edit/:id', async (req, res) => {
  try {
    const username = req.session.user.userId;

    const { exerciseName, exerciseSets, exerciseReps, exerciseWeight, group, time } = req.body;

    const exercises = Array.isArray(exerciseName) ? exerciseName.map((name, i) => ({
      name: name.trim(),
      sets: Number(exerciseSets[i]),
      reps: Number(exerciseReps[i]),
      weight: Number(exerciseWeight[i])
    })) : [{
      name: exerciseName.trim(),
      sets: Number(exerciseSets),
      reps: Number(exerciseReps),
      weight: Number(exerciseWeight)
    }];


    for (let exercise of exercises){
      if (
        exercise.sets < 0 ||
        exercise.reps < 0 ||
        exercise.weight < 0
      ) {
        throw new Error('Exercise fields cannot be negative');
      }
    }



    //const parsedExercises = JSON.parse(exercises);
    await updateWorkout(req.params.id, { username, group, time, exercises: exercises });
    res.redirect('/workouts');
  } catch (e) {

    if (e == 'No changes made'){


      const muscleGroups = [
      'Push', 'Pull', 'Legs', 'Chest', 'Triceps', 'Shoulders', 'Upper Back', 'Lats', 'Biceps', 'Forearms', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Cardio'
      ];
      const workout = await getWorkoutById(req.params.id);
      return res.render('workoutFOrm', {
        isEdit: true,
        workout,
        groups: muscleGroups,
        unchanged: true
      });
    }

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

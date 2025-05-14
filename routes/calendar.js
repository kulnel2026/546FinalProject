import { Router } from 'express';
import { getAllWorkouts, getWorkoutById } from '../data/workouts.js';
import { createEntry, getEntriesByUser } from '../data/calendarEntries.js';
import { getMealsByUser } from '../data/meals.js';
import { users } from '../config/mongoCollections.js';
import { getUserByUserId} from '../data/users.js';
import xss from 'xss';


const router = Router();

// GET /calendar → render calendar with workouts and meals for client
router.get('/', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: 'You must be logged in to view your calendar.'
      });
    }

    const userId = req.session.user.userId;
    // determine month & year
    const month = Number(req.query.month) || (new Date()).getMonth() + 1;
    const year  = Number(req.query.year)  || (new Date()).getFullYear();
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    // build workout map for client
    const entries = await getEntriesByUser(userId);
    const workoutMap = {};
    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split('T')[0];
      const names   = entry.workouts.map(w => w.name);
      workoutMap[dateStr] = (workoutMap[dateStr] || []).concat(names);
    }

    // build meal map for client
    const allMeals = await getMealsByUser(userId);
    const mealMap  = {};
    for (const meal of allMeals) {
      const d = new Date(meal.date);
        const dateStr = d.toISOString().split('T')[0];
        mealMap[dateStr] = (mealMap[dateStr] || []).concat(meal.name);
    }

    // send both maps as JSON blobs for calendar.js
    return res.render('calendar', {
      title:           'Your Calendar',
      loggedIn:        true,
      workoutMapJSON:  JSON.stringify(workoutMap),
      mealMapJSON:     JSON.stringify(mealMap),
      sessionUserId: req.session.user.userId
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});

// GET /calendar/selectWorkout → show workout picker for a date
router.get('/selectWorkout', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).render('error', { error: 'Login required.' });
  }
  const { date } = req.query;
  const username = req.session.user.userId;
  try {
    const saved = await getAllWorkouts(username);
    return res.render('selectWorkout', {
      title:         `Add Workout to ${date}`,
      date,
      savedWorkouts: saved,
      loggedIn:      true
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error fetching workouts',
      error: e.toString()
    });
  }
});

router.get('/search', async (req, res) => {

  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).render('error', {
        title: 'Invalid Search',
        error: 'You must enter a valid username.'
      });
    }
    const user = await getUserByUserId(username.trim());
    if (!user) {
      // Load own calendar with error message
      const userId = req.session.user.userId;
      const entries = await getEntriesByUser(userId);
      const workoutMap = {};
      for (const entry of entries) {
        const dateStr = entry.date.toISOString().split('T')[0];
        const names = entry.workouts.map(w => w.name);
        workoutMap[dateStr] = (workoutMap[dateStr] || []).concat(names);
      }

      const allMeals = await getMealsByUser(userId);
      const mealMap = {};
      for (const meal of allMeals) {
        const d = new Date(meal.date);
        const dateStr = d.toISOString().split('T')[0];
        mealMap[dateStr] = (mealMap[dateStr] || []).concat(meal.name);
      }

      return res.render('calendar', {
        title: 'Your Calendar',
        loggedIn: true,
        workoutMapJSON: JSON.stringify(workoutMap),
        mealMapJSON: JSON.stringify(mealMap),
        sessionUserId: userId,
        errorMessage: `No user found with ID "${username}".`
      });
    }
    const userId = user.userId;

    // Get entries
    const entries = await getEntriesByUser(userId);
    const workoutMap = {};
    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split('T')[0];
      const names = entry.workouts.map(w => w.name);
      workoutMap[dateStr] = (workoutMap[dateStr] || []).concat(names);
    }

    // Get meals
    const allMeals = await getMealsByUser(userId);
    const mealMap = {};
    for (const meal of allMeals) {
      const d = new Date(meal.date);
      const dateStr = d.toISOString().split('T')[0];
      mealMap[dateStr] = (mealMap[dateStr] || []).concat(meal.name);
    }

    return res.render('calendar', {
      title: `Viewing ${userId}'s Calendar`,
      loggedIn: true,
      workoutMapJSON: JSON.stringify(workoutMap),
      mealMapJSON: JSON.stringify(mealMap),
      viewedUser: userId,
      readOnly: true,
      sessionUserId: req.session.user.userId
    });
  } catch (e) {
    return res.status(500).render('error', {
      title: 'Error',
      error: e.toString()
    });
  }
});


// POST /calendar/assignWorkout → add workout entry
router.post('/assignWorkout', async (req, res) => {
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
  try {
    const workout = await getWorkoutById(workoutId);
    const workoutGroup = workout.group?.trim() || "";
    if (!workout || !Array.isArray(workout.exercises)) {
      return res.status(404).render('error', {
        title: 'Workout Not Found',
        error: 'Workout does not exist or has no exercises.'
      });
    }
    const formatted = workout.exercises.map(ex => ({
      name:   ex.name.toString().trim(),
      sets:   ex.sets.toString().trim(),
      reps:   ex.reps.toString().trim(),
      weight: ex.weight.toString().trim(),
      group:  workout.group?.trim()
    }));
    await createEntry(userId, date.trim(), formatted, []);

    const userCollection = await users();
    const updateResult = await userCollection.updateOne(
      { userId: userId },
      { $push: {workoutHistory: {group: workoutGroup, date: date.trim()}}}
    );




    return res.redirect('/calendar');
  } catch (err) {
    return res.status(500).render('error', {
      title: 'Assignment Error',
      error: err.toString()
    });
  }
});

router.post('/reaction', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ error: 'Not logged in' });
  }

  const { date, type } = req.body;
  const userId = req.session.user.userId;

  if (!date || !type) {
    return res.status(400).json({ error: 'Missing date or reaction type' });
  }

  try {
    const userCollection = await users();
    await userCollection.updateOne(
      { userId },
      { $push: { reactions: { date, type, createdAt: new Date() } } }
    );
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save reaction', details: err.toString() });
  }
});

router.post('/comment', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ error: 'Not logged in' });
  }
  //const userId = req.session.user.userId;
  const { date, comment, userId } = req.body;
  const author = req.session.user.userId;

  if (!date || !comment || !userId ) {
    return res.status(400).json({ error: 'Missing date or comment' });
  }

  try {
    const sanitizedComment = xss(comment);
    const userCollection = await users();
    await userCollection.updateOne( 
      { userId },
      { $push: { comments: { date, comment: sanitizedComment, author, createdAt: new Date() } } }
    );
    return res.json({ comment: sanitizedComment, author, date: date });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save comment', details: err.toString() });
  }
});



router.get('/comments', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ error: 'Not logged in' });
  }

  const date = req.query.date;
  const targetUserId = req.query.userId || req.session.user.userId;

  if (!date) {
    return res.status(400).json({ error: 'Missing date' });
  }

  try {
    const userCollection = await users();
    const user = await userCollection.findOne({ userId: targetUserId });
    const comments = (user?.comments || []).filter(c => c.date === date);
    return res.json(comments);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch comments', details: err.toString() });
  }
});



export default router;

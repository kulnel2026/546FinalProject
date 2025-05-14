
// routes/mealTrackerRoutes.js
import { Router } from 'express';
import {
  getMealsByUser,
  getMealById,
  addMeal,
  updateMeal,
  removeMeal,
  getSavedMeals,
  addSavedMeal,
  removeSavedMeal,
  updateSavedMeal
} from '../data/meals.js';

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

// GET /meals → render tracker
router.get('/', requireLogin, async (req, res) => {
  try {
    const userId        = extractUserId(req.session.user);
    const selectedISODate = req.query.date || new Date().toISOString().slice(0, 10);
    const saveError     = req.query.saveError;

    const allMeals = await getMealsByUser(userId);
    const meals    = allMeals.filter(m =>
      (m.date || '').slice(0,10) === selectedISODate
    );

    let savedMeals = await getSavedMeals(userId);
    savedMeals = savedMeals.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fat      += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    res.render('mealTracker', {
      title:            'Meal Tracker',
      loggedIn:         true,
      selectedISODate,
      meals,
      savedMeals,
      dailyTotals,
      saveError        // this drives your {{#if saveError}} banner
    });
  } catch (e) {
    // ... your existing error path
  }
});

// POST /meals/add → add new meal
router.post('/add', requireLogin, async (req, res) => {
  try {
    const userId = extractUserId(req.session.user);
    const { filterDate, entryDate } = req.body;
    if (typeof req.body.name !== 'string' || !/^[A-Za-z ]+$/.test(req.body.name)) {
      throw new Error('Name must contain only letters and spaces');
    }
    req.body.date = entryDate;
    await addMeal(userId, req.body);
    return res.redirect(`/meals?date=${encodeURIComponent(filterDate)}`);

  } catch (e) {
    const userId     = extractUserId(req.session.user);
    const allMeals  = await getMealsByUser(userId);
    const { filterDate} = req.body;
    const meals      = allMeals.filter(m => (m.date||'').slice(0,10) === filterDate);
    let savedMeals = await getSavedMeals(userId);
    savedMeals = savedMeals.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fat     += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    res.status(400).render('mealTracker', {
      title:        'Meal Tracker',
      loggedIn:     true,
      meals,
      savedMeals,
      selectedISODate: filterDate,
      dailyTotals,
      error:        e.message
    });
  }
});

// POST /meals/saved → add a new saved template
router.post('/saved', requireLogin, async (req, res) => {
  const { filterDate } = req.body;
  
  const userId     = extractUserId(req.session.user);
  const allMeals   = await getMealsByUser(userId);
  const meals    = allMeals.filter(m =>
    (m.date||'').slice(0,10) === filterDate
  );
  let savedMeals   = await getSavedMeals(userId);

  const dailyTotals = meals.reduce((acc, m) => {
    acc.calories += Number(m.calories) || 0;
    acc.protein  += Number(m.protein)  || 0;
    acc.carbs    += Number(m.carbs)    || 0;
    acc.fat     += Number(m.fat)      || 0;
    return acc;
  }, { calories:0, protein:0, carbs:0, fat:0 });

  try {
    if (typeof req.body.name !== 'string' || !/^[A-Za-z ]+$/.test(req.body.name)) {
      throw new Error('Name must contain only letters and spaces');
    }
    const newTemplate = {
      name:     req.body.name,
      calories: Number(req.body.calories),
      protein:  Number(req.body.protein),
      carbs:    Number(req.body.carbs),
      fat:      Number(req.body.fat)
    };
    await addSavedMeal(userId, newTemplate);
    return res.redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  } catch (e) {
    // render with the error banner
    return res.status(400).render('mealTracker', {
      title:        'Meal Tracker',
      loggedIn:     true,
      selectedISODate:  filterDate,
      meals,
      savedMeals,
      dailyTotals,
      saveError:    e.message    // show “Nutrients must be non‑negative” (or duplicates)
    });
  }
});

// PUT /meals/saved/:id → update a saved meal template inline
router.put('/saved/:id', requireLogin, async (req, res) => {
  try {
    const userId = extractUserId(req.session.user);
    await updateSavedMeal(req.params.id, userId, req.body);
    return res.json({ success:true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// POST /meals/saved/:id/delete → remove a saved template
router.post('/saved/:id/delete', requireLogin, async (req, res) => {
  const { filterDate } = req.body;
  try {
    const userId = extractUserId(req.session.user);
    await removeSavedMeal(req.params.id, userId);
    return res.redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  } catch (e) {
    return res.status(500).redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  }
});

router.post('/:id/save', requireLogin, async (req, res) => {
  const userId     = extractUserId(req.session.user);
  const { filterDate } = req.body; // from your hidden <input name="filterDate">

  try {
    const meal  = await getMealById(req.params.id, userId);
    const saved = await getSavedMeals(userId);

    // duplicate?
    if (saved.some(s =>
      s.name     === meal.name &&
      Number(s.calories) === Number(meal.calories) &&
      Number(s.protein)  === Number(meal.protein)  &&
      Number(s.carbs)    === Number(meal.carbs)    &&
      Number(s.fat)      === Number(meal.fat)
    )) {
      throw new Error('Meal already exists in saved meals');
    }

    // insert new template
    await addSavedMeal(userId, {
      name:     meal.name,
      calories: meal.calories,
      protein:  meal.protein,
      carbs:    meal.carbs,
      fat:      meal.fat
    });

    // success → back to list view for that date
    return res.redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  } catch (e) {
    // on error, re‑fetch all the data for that same date and render with saveError
    const allMeals   = await getMealsByUser(userId);
    const meals      = allMeals.filter(m => (m.date||'').slice(0,10) === filterDate);
    let savedMeals   = await getSavedMeals(userId);
    savedMeals       = savedMeals.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fat      += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0 });

    // render mealTracker with a banner but keep the same filterDate
    return res.status(400).render('mealTracker', {
      title:            'Meal Tracker',
      loggedIn:         true,
      selectedISODate:  filterDate,
      meals,
      savedMeals,
      dailyTotals,
      saveError:        e.message
    });
  }
});


// POST /meals/:id/delete → delete a logged meal
router.post('/:id/delete', requireLogin, async (req, res) => {
  const { filterDate } = req.body;
  try {
    const userId = extractUserId(req.session.user);
    await removeMeal(req.params.id, userId);
    return res.redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  } catch (e) {
    return res.status(500).redirect(`/meals?date=${encodeURIComponent(filterDate)}`);
  }
});


// PUT /meals/:id → update a logged meal inline
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (req.body.name && !/^[A-Za-z ]+$/.test(req.body.name)) {
      return res.status(400).json({ success:false, error:'Name must contain only letters and spaces' });
    }
    const userId = extractUserId(req.session.user);
    await updateMeal(req.params.id, userId, req.body);
    return res.json({ success:true });
  } catch (e) {
    return res.status(400).json({ error:e.message });
  }
});

export default router;

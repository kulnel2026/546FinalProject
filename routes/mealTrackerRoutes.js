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
    const userId = extractUserId(req.session.user);

    // 1) figure out which ISO date to show (YYYY‑MM‑DD)
    const isoDate = req.query.date || new Date().toISOString().slice(0,10);

    // 2) fetch all meals and filter to that day
    const allMeals = await getMealsByUser(userId);
    const meals = allMeals.filter(m => {
      const mIso = new Date(m.date).toISOString().slice(0,10);
      return mIso === isoDate;
    });

    // 3) fetch saved meals unchanged
    let savedMeals = await getSavedMeals(userId);
    savedMeals = savedMeals.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
    
    // 4) compute totals for just this day
    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fats     += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fats:0 });

    // 5) render with both ISO and pretty dates
    res.render('mealTracker', {
      title:             'Meal Tracker',
      loggedIn:          true,
      meals,             // filtered by date
      savedMeals,        // all saved templates
      selectedISODate:   isoDate,            // for <input type="date">
      dailyTotals
    });

  } catch (e) {
    // note: isoDate may be undefined here, so recalc
    const isoDate = req.query.date || new Date().toISOString().slice(0,10);
    res.status(500).render('mealTracker', {
      title:             'Meal Tracker',
      loggedIn:          true,
      meals:             [],
      savedMeals:        [],
      selectedISODate:   isoDate,
      dailyTotals:       { calories:0, protein:0, carbs:0, fats:0 },
      error:             e.message
    });
  }
});

// POST /meals/add → add new meal
router.post('/add', requireLogin, async (req, res) => {
  try {
    const userId = extractUserId(req.session.user);

    // 1) determine current view-date
    const isoDate   = req.body.filterDate
                    || req.query.date
                    || new Date().toISOString().slice(0,10);

    // 2) determine which date to stamp on the new meal
    const entryDate = req.body.entryDate || isoDate;

    // 3) build and add the meal
    const mealData = {
      name:     req.body.name,
      date:     entryDate,
      calories: Number(req.body.calories),
      protein:  Number(req.body.protein),
      carbs:    Number(req.body.carbs),
      fat:      Number(req.body.fat)
    };
    await addMeal(userId, mealData);

    // 4) redirect back to the same date view
    return res.redirect(`/meals?date=${isoDate}`);

  } catch (e) {
    // on error, re‑fetch for that same date and re‑render
    const userId     = extractUserId(req.session.user);
    const isoDate    = req.body.filterDate
                     || req.query.date
                     || new Date().toISOString().slice(0,10);
    const allMeals   = await getMealsByUser(userId);
    const meals      = allMeals.filter(m =>
      new Date(m.date).toISOString().slice(0,10) === isoDate
    );
    const savedMeals = await getSavedMeals(userId);
    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fats     += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fats:0 });

    return res.status(400).render('mealTracker', {
      title:           'Meal Tracker',
      loggedIn:        true,
      meals,
      savedMeals,
      selectedISODate: isoDate,
      dailyTotals,
      error:           e.message
    });
  }
});

// POST /meals/saved → add a new saved template
router.post('/saved', requireLogin, async (req, res, next) => {
  try {
    const userId = extractUserId(req.session.user);
    const newTemplate = {
      name:     req.body.name,
      calories: Number(req.body.calories) || 0,
      protein:  Number(req.body.protein)  || 0,
      carbs:    Number(req.body.carbs)    || 0,
      fat:      Number(req.body.fat)      || 0
    };
    const inserted = await addSavedMeal(userId, newTemplate);
    return res.redirect('/meals');
  } catch (e) {
    return next(e);
  }
});

// PUT /meals/saved/:id → update a saved meal template inline
router.put('/saved/:id', requireLogin, async (req, res) => {
  try {
    const userId  = extractUserId(req.session.user);
    const updated = await updateSavedMeal(req.params.id, userId, req.body);
    return res.json({ success: true, updated });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// POST /meals/saved/:id/delete → remove a saved template
router.post('/saved/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const userId = extractUserId(req.session.user);
    await removeSavedMeal(req.params.id, userId);
    return res.redirect('/meals');
  } catch (e) {
    return next(e);
  }
});

// POST /meals/:id/save → save a logged meal as a template
router.post('/:id/save', requireLogin, async (req, res, next) => {
  try {
    const userId   = extractUserId(req.session.user);
    const meal     = await getMealById(req.params.id, userId);
    const saved    = await getSavedMeals(userId);
    const meals    = await getMealsByUser(userId);
    const dailyTotals = meals.reduce((acc, m) => {
      acc.calories += Number(m.calories) || 0;
      acc.protein  += Number(m.protein)  || 0;
      acc.carbs    += Number(m.carbs)    || 0;
      acc.fats     += Number(m.fat)      || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fats:0 });

    const duplicate = saved.some(s =>
      s.name     === meal.name     &&
      Number(s.calories) === Number(meal.calories) &&
      Number(s.protein)  === Number(meal.protein)  &&
      Number(s.carbs)    === Number(meal.carbs)    &&
      Number(s.fat)      === Number(meal.fat)
    );

    if (duplicate) {
      return res.status(400).render('mealTracker', {
        title:       'Meal Tracker',
        loggedIn:    true,
        meals,
        savedMeals:  saved,
        selectedISODate: isoDate,
        dailyTotals,
        saveError:   'Meal already exists in saved meals'
      });
    }

    await addSavedMeal(userId, {
      name:     meal.name,
      calories: meal.calories,
      protein:  meal.protein,
      carbs:    meal.carbs,
      fat:      meal.fat
    });
    return res.redirect('/meals');
  } catch (e) {
    return next(e);
  }
});

// POST /meals/:id/delete → delete a logged meal
router.post('/:id/delete', requireLogin, async (req, res, next) => {
  try {
    const userId = extractUserId(req.session.user);
    await removeMeal(req.params.id, userId);
    return res.redirect('/meals');
  } catch (e) {
    return next(e);
  }
});

// PUT /meals/:id → update a logged meal inline
router.put('/:id', requireLogin, async (req, res) => {
  try {
    const userId = extractUserId(req.session.user);
    await updateMeal(req.params.id, userId, req.body);
    return res.json({ success: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;

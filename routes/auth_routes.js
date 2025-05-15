import {Router} from 'express';
import { users } from '../config/mongoCollections.js';
import { register, login } from '../data/users.js';
import { createWorkout, getAllWorkouts, getWorkoutById, deleteWorkoutById, updateWorkout } from '../data/workouts.js';
import { workouts } from '../config/mongoCollections.js';
import { goalTracker } from '../config/mongoCollections.js'; 

const router = Router();

router.route('/').get(async (req, res) => {
  //code here for GET
  const loggedIn = Boolean(req.session.user);
  const role = loggedIn ? req.session.user.role:null;
  
  res.render('home', {
    title: 'Macro Motion',
    loggedIn,
    role
  });
});

router
  .route('/register')
  .get(async (req, res) => {
    //code here for GET
    if (req.session.user) return res.redirect('/');
    res.render('register', { title: 'Register' });
  })
  .post(async (req, res) => {
    //code here for POST
    if (req.session.user) return res.redirect('/');
    try {
      const {
        firstName,
        lastName,
        userId,
        password,
        confirmPassword,
      } = req.body;

      // Confirm password match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      const result = await register(
        firstName,
        lastName,
        userId,
        password,

      );

      if (result.registrationCompleted) {
        return res.redirect('/login');
      }

      res.status(500).render('register', {
        title: 'Register',
        error: 'Internal Server Error'
      });
    } catch (e) {
      res.status(400).render('register', {
        title: 'Register',
        error: e.message
      });
    }
  });

router
  .route('/login')
  .get(async (req, res) => {
    //code here for GET
    if (req.session.user) return res.redirect('/');
    res.render('login', { title: 'Sign In' });
  })
  .post(async (req, res) => {
    //code here for POST
    if (req.session.user) return res.redirect('/');
    try {
      const { userId, password } = req.body;
      const userData = await login(userId, password);
      req.session.user = userData;
      return res.redirect('/');
    } catch (e) {
      res.status(400).render('login', {
        title: 'Sign In',
        error: e.message
      });
    }
  });

router.route('/user').get(async (req, res) => {
  //code here for GET
  if (!req.session.user) return res.redirect('/login');

  const { firstName, lastName, userId, signupDate, lastLogin } = req.session.user;
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hStr = String(hours).padStart(2, '0');
    const minStr = String(now.getMinutes()).padStart(2, '0');

    res.render('user', {
      title: 'User Page',
      user: { firstName, lastName, userId, signupDate, lastLogin },
      currentTime: `${hStr}:${minStr}${ampm}`,
      currentDate: `${month}/${day}/${year}`
    });
});

router.get('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = req.session.user;
  const userId = user.userId;
  const userCollection = await users();
  const userFromDb = await userCollection.findOne({ userId });

  const createdDate = new Date(user.signupDate).toLocaleDateString();

  
  let workoutSplits = [];
  try {
    const allWorkouts = await getAllWorkouts(userId);
    workoutSplits = allWorkouts.map(w => ({
      group: w.group || 'Unnamed Group',
      exercises: w.exercises.map(ex => ex.name)
    }));
  } catch (e) {
    console.error('Failed to load workout splits:', e);
  }

  let latestGoals = null;
  try {
    const goalCollection = await goalTracker();
    latestGoals = await goalCollection.findOne(
      { userId },
      { sort: { _id: -1 } } // Get the most recent one
    );
  } catch (e) {
    console.error('Failed to fetch goals:', e);
  }

  res.render('profile', {
    title: 'User Profile',
    username: user.userId,
    createdDate,
    goals: latestGoals || null, // Send the latest goal object
    workouts: userFromDb.workoutHistory || [],
    splits: workoutSplits
  });
});

router.route('/signout').get((req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    // Clear the session cookie (match the name you used in session config)
    res.clearCookie('AuthCookie');
    // Redirect back to your home page
    res.redirect('/');
  });
});

export default router;

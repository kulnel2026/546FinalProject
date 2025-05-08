import {Router} from 'express';
import { register, login } from '../data/users.js';
const router = Router();

router.route('/').get(async (req, res) => {
  //code here for GET
  const loggedIn = Boolean(req.session.user);

  res.render('main', {
    title: 'Nutrition and Workout Tracker - Login System',
    description: 'This is a login system for our Nutrition and Workout Tracker. Welcome! Please register or log in to continue.',
    loggedIn,
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
      return res.redirect('/user');
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

router.route('/signout').get(async (req, res) => {
  //code here for GET
  req.session.destroy();
  res.render('signout', { title: 'Signed Out' });
});

export default router;

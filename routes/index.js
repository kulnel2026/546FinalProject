import authRoutes from './auth_routes.js';
import workouts from './workouts.js'
import calendarRoutes from './calendar.js';
import mealTrackerRoutes from './mealTrackerRoutes.js'
import goalTrackerRoutes from './goalTracker.js'

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/workouts', workouts);
  app.use('/calendar', calendarRoutes);
  app.use('/meals', mealTrackerRoutes);
  app.use('/goals', goalTrackerRoutes)
  app.use((req, res) => {
    res.status(404).send('Not found');
  });
};

export default constructorMethod;

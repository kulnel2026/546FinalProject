import authRoutes from './auth_routes.js';
import mealTrackerRoutes from './mealTrackerRoutes.js';
import nutrientTracker from './nutrientTrackerRoutes.js';

const constructorMethod = (app) => {
  // Authentication routes
  app.use('/', authRoutes);

  // Nutrition Goal Tracker routes
  app.use('/nutrients', nutrientTracker);

  app.use('/meals', mealTrackerRoutes);


  // Catch-all 404 handler
  app.use((req, res) => {
    res.status(404).send('Not found');
  });
};

export default constructorMethod;

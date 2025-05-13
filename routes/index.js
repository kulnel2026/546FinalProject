import authRoutes from './auth_routes.js';
import calendarRoutes from './calendar.js';

const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/calendar', calendarRoutes);

  app.use((req, res) => {
    res.status(404).send('Not found');
  });
};

export default constructorMethod;

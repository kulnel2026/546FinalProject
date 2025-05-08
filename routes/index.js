import authRoutes from './auth_routes.js';

const constructorMethod = (app) => {
  app.use('/auth_routes', authRoutes);

  app.use(/(.*)/, (req, res) => {
    res.status(404).json({error: 'Route Not found'});
  });
};

export default constructorMethod;
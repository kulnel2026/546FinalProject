import express from 'express';
import exphbs from 'express-handlebars';
import workoutsRoutes from './routes/workouts.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use('/workouts', workoutsRoutes);

app.get('/', (req, res) => res.redirect('/workouts/form'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

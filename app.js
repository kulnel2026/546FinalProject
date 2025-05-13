import express from 'express';
const app = express();
import cookieParser from 'cookie-parser';
import configRoutes from './routes/index.js';
import exphbs from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// codebase lecture 9
app.use(cookieParser());

app.use('/public', express.static(path.join(__dirname, 'public')));

const handlebarsInstance = exphbs.create({
     defaultLayout: 'main',
     // Specify helpers which are only registered on this instance.
     helpers: {
       asJSON: (obj, spacing) => {
         if (typeof spacing === 'number')
           return new Handlebars.SafeString(JSON.stringify(obj, null, spacing));
   
         return new Handlebars.SafeString(JSON.stringify(obj));
       },
   
       partialsDir: ['views/partials/']
     }
});
   
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', handlebarsInstance.engine);
app.set('view engine', 'handlebars');

app.use(session({
     nname: "AuthCookie",
     secret: "This is SHER-LOCKED",
     saveUninitialized: true,
     resave: false,
}));

app.use((req, res, next) => {
     const ts = new Date().toUTCString();
     const method = req.method;
     const path = req.path;
     const isAuth = !!req.session.user;
     const status = req.session.user ? 'Authenticated User' : 'Non-Authenticated';
     console.log(`[${ts}]: ${method} ${path} (${status})`);
     next();
});

function blockAuth(req, res, next) {
  if (req.session.user) {
    // redirect *to* /user (or whatever page you want)
    return res.redirect('/user');
  }
  next();
}

app.use('/login', blockAuth);
app.use('/register', blockAuth);

function requireAuth(req, res, next) {
     if (!req.session.user) return res.redirect('/login');
     next();
}
app.use('/user', requireAuth);

function requireSignout(req, res, next) {
     if (!req.session.user) return res.redirect('/login');
     next();
}
app.use('/signout', requireSignout);

let totalRequests = 0;
app.use((req, res, next) => {
  totalRequests++;
  console.log(`Total requests: ${totalRequests}`);
  next();
});

const pathsAccessed = {};
app.use((req, res, next) => {
  pathsAccessed[req.path] = (pathsAccessed[req.path] || 0) + 1;
  console.log(`Path ${req.path} accessed ${pathsAccessed[req.path]} times`);
  next();
});
   
   // 10. Deny /admin
   app.use('/admin', (req, res) => {
     console.log("Admin access denied");
     res.status(403).json({ error: '403: Forbidden' });
   });
   
   // 11. Override GET to PUT for /posts
   app.use('/posts', (req, res, next) => {
     if (req.method === 'GET') req.method = 'PUT';
     next();
   });
   
   // 12. Track lastAccessed cookie
   app.use((req, res, next) => {
     console.log('Cookies:', req.cookies);
     if (req.cookies.lastAccessed) {
       console.log('Last accessed:', req.cookies.lastAccessed);
     }
     if (totalRequests % 5 === 0) {
       const past = new Date(Date.now() - 3600000);
       res.cookie('lastAccessed', '', { expires: past });
       res.clearCookie('lastAccessed');
       return next();
     }
     const now = new Date();
     const exp = new Date(now.getTime() + 3600000);
     res.cookie('lastAccessed', now.toString(), { expires: exp });
     next();
   });
   
   app.use((req, res, next) => {
    res.locals.loggedIn = Boolean(req.session.user);
    next();
  });

   // Mount routes and start server
configRoutes(app);
   
app.use((req, res) => {
  res.status(404).render('error', { message: 'Route not found' });
});
   
app.listen(3000, () => {
     console.log("Server running on http://localhost:3000");
});
   
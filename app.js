require('dotenv').config()

const bcrypt = require('bcryptjs')
const express = require('express')
const session = require("express-session");
const mongoose = require('mongoose')
const MongoDBSession = require('connect-mongodb-session')(session)
const cookieParser = require("cookie-parser");
const passport = require('passport');
const cluster = require('cluster');
const core = require('os')
///////////// Rutas Info y Random //////////////
const routerInfo = require('./routes/info.routes')
const routerRandom = require('./routes/random.routes')
////////////////////////////////////////////////

///////////// YARGS //////////////
let PORT = process.env.PORT || 8080;
let modo = 'fork'
const yargs = require('yargs');
yargs.version('1.0.0');
yargs.command({
  command: 'port',
  describe: 'Puerto de escucha de la aplicación',
  builder: {
    p: {
      describe: 'Nro del puerto',      
      default: 8080,    
    }
  },
  handler: function (argv){ 
    PORT = process.env.PORT || argv.p;
  }
})
yargs.command({
  command: 'modo',
  describe: 'Indica Modo CLUSTER o FORK',
  builder: {
    m: {
      describe: 'Modo de ejecución',      
      default: 'fork',    
    }
  },
  handler: function (argv){ 
    modo = argv.m;
  }
})
yargs.parse();
//////////////////////////////////

// Local Strategy
require('./strategies/local') 

const UserModel = require('./models/user.model');

const app = express();

///////////////// Conexión MONGO DB /////////////////////////////////

/////////////////////////////////////////////////////////////////////
const store = new MongoDBSession({
  uri: process.env.mongo_URI,
  collection: 'mySessions'
})
/////////////////////////////////////////////////////////////////////
mongoose.connect(process.env.mongo_URI, {
  useNewUrlParser: true,   
  useUnifiedTopology: true
}).then( res => console.log('Base de datos conectada!!'))
  .catch( err => console.log('Error al conectar la base de datos!!'))
//////// Middlewares ////////
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(session({
    key: process.env.SESSION_KEY,
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,  
    store: store,  
    cookie: { maxAge: 1000*60*60 }  // 1 hora
}))

//////// Passport ////////
app.use(passport.initialize());
app.use(passport.session());


const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) return next()
  res.redirect('/login')
}

const isLoggedOut = (req, res, next) => {
  if(!req.isAuthenticated()) return next()
  res.redirect('/')
}

app.get('/', isLoggedIn, (req, res) => {   
  const response = req.user;    
  res.render('dashboard', response); 
})

app.get('/register', isLoggedOut, (req, res) => {  
  const response = {
    error: req.query.error,
    msg: req.query.msg
   }
  res.render('register', response);
})

app.get('/login', isLoggedOut, (req, res) => {  

  const response = {
   error: req.query.error
  }

  res.render('login', response);
})

app.post('/register', async (req, res) => { 
  const {username, email, password} = req.body;
  try {
    let user = await UserModel.findOne({ username })
    if(user) res.redirect('/register?error=true&msg=Username ya registrado')

    const hashPassword = await bcrypt.hash(password, 12);

    user = await UserModel.create({
      username,
      email,
      password: hashPassword
    })
    res.redirect('/');
  } catch (error) {
    
  }
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login?error=true'
}))

app.get('/logout', function (req, res, next) {
	req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

/* app.get('/auth/google',passport.authenticate('google', { scope: ['profile', 'email'] })); */

/* app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=true', successRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  }); */


if(cluster.isPrimary) {
  console.log(`Proceso padre: ${process.pid}`);  
  console.log(`modo: ${modo}`);

  if(modo !== 'fork'){
    for (let i = 0; i < core.cpus().length; i++) {
      cluster.fork()    
    }
  
    // reemplazar workers en caso de que mueran
    cluster.on('exit',() => cluster.fork())
  }else {
    cluster.fork()
  }  
  
}else {  
  app.listen(PORT, () => console.log(`Server up on port ${PORT}, process id=${process.pid}`))

  /// Desafio Objeto Process
  app.use('/info', routerInfo)

  /// Desafio Procesos Hijos
  app.use('/api/randoms', routerRandom)
}
require('dotenv').config()

const bcrypt = require('bcryptjs')
const express = require('express')
const session = require("express-session");
const mongoose = require('mongoose')
const MongoDBSession = require('connect-mongodb-session')(session)
const cookieParser = require("cookie-parser");
const passport = require('passport');
const cluster = require('cluster');
const core = require('os');
const compression = require('compression');

///////  LOGGER///////////////
const { logger_info, logger_warn } = require('./logger/log_config');

///////////// Rutas Info, Random y Products//////////////
const routerInfo = require('./routes/info.routes')
const routerRandom = require('./routes/random.routes')
const productsRouter = require('./routes/product.routes');
////////////////////////////////////////////////

///////////// YARGS //////////////
const yargs = require('yargs');
yargs.version('1.0.0');

let PORT = yargs.argv.port || process.env.PORT || 8080;
let modo = yargs.argv.modo || 'fork';

yargs.parse();
//////////////////////////////////

// Local Strategy
require('./strategies/local') 

const UserModel = require('./models/user.model');

const app = express();

///////////////// Sesión MONGO DB //////////////////////////////
const store = new MongoDBSession({
  uri: process.env.mongo_URI,
  collection: 'mySessions'
})
//////////////////////////////////////////////////////////////////


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

//////// Compression ////////
app.use(compression());
/////////////////////////////

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

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = req.user;    
  res.render('dashboard', response); 
})

app.get('/register', isLoggedOut, (req, res) => {
  
  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = {
    error: req.query.error,
    msg: req.query.msg
   }
  res.render('register', response);
})

app.get('/login', isLoggedOut, (req, res) => {  

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = {
   error: req.query.error
  }

  res.render('login', response);
})

app.post('/register', async (req, res) => { 

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);

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

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);
  
	req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


if(cluster.isPrimary) {  

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
  mongoose.connect(process.env.mongo_URI, {
    useNewUrlParser: true,   
    useUnifiedTopology: true
  }).then( res => console.log('Base de datos conectada!!'))
    .catch( err => console.log('Error al conectar la base de datos!!'))

  app.listen(PORT, () => console.log(`Server up on port ${PORT}, process id=${process.pid}`))

  /// Desafio Objeto Process
  app.use('/info', routerInfo)

  /// Desafio Procesos Hijos
  app.use('/api/randoms', routerRandom)

  /// Ruta de Productos (ej para el logger)
  app.use('/api/products', productsRouter)

  // Cuando no existe la ruta
  app.use((req, res)=> {
    logger_warn.error(`Ruta ${req.method} - ${req.baseUrl}${req.url} no encontrada`);
    res.status(404).send({status: 'ERROR', result: `Ruta ${req.method} - ${req.baseUrl}${req.url} no encontrada`})
  });
}
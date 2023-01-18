require('dotenv').config()

const express = require('express')
const session = require("express-session");
const MongoDBSession = require('connect-mongodb-session')(session)
const cookieParser = require("cookie-parser");
const passport = require('passport');
const cluster = require('cluster');
const core = require('os');
const compression = require('compression');

///////  LOGGER///////////////
const { logger_warn } = require('./logger/log_config');

///////////// Rutas Info, Random y Products//////////////
const routerInfo = require('./routes/info.routes')
const routerRandom = require('./routes/random.routes')
const productsRouter = require('./routes/product.routes');
const loginRouter = require('./routes/login.routes');
//////////////////////////////////////////////////////////

///////////// YARGS //////////////
const yargs = require('yargs');
yargs.version('1.0.0');

let PORT = yargs.argv.port || process.env.PORT || 8080;
let modo = yargs.argv.modo || 'fork';

yargs.parse();
//////////////////////////////////

//////// Conexión MongoDB ////////
require('./database');

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


if(cluster.isPrimary) {  

  for (let i = 0; i < core.cpus().length; i++) {
    cluster.fork()    
  }

  // reemplazar workers en caso de que mueran
  cluster.on('exit',() => cluster.fork())  
  
}else {    
  app.use('/', loginRouter)

  /// Desafio Objeto Process
  app.use('/info', routerInfo)

  /// Desafio Procesos Hijos
  app.use('/api/randoms', routerRandom)

  /// Ruta de Productos (ej para el logger)
  app.use('/api/products', productsRouter)

  // Cuando no existe la ruta
  app.use((req, res)=> {
    logger_warn.error(`Ruta ${req.method} - "${req.baseUrl}${req.url}" no encontrada`);
    res.status(404).send({status: 'ERROR', result: `Ruta ${req.method} - ${req.baseUrl}${req.url} no encontrada`})
  });

  app.listen(PORT, () => console.log(`Server up on port ${PORT}, process id ${process.pid}`))  
}
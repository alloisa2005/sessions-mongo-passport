require('dotenv').config()

const express = require('express')
const session = require("express-session");
const mongoose = require('mongoose')
const MongoDBSession = require('connect-mongodb-session')(session)
const cookieParser = require("cookie-parser");
const passport = require('passport');
const localStrategy = require('passport-local').Strategy

const app = express();
const PORT = process.env.PORT || 8080

///////////////// Conexión MONGO DB /////////////////////////////////
mongoose.connect(process.env.mongo_URI, {
  useNewUrlParser: true,   
  useUnifiedTopology: true
}).then( res => console.log('Base de datos conectada!!'))
  .catch( err => console.log('Error al conectar la base de datos!!'))
/////////////////////////////////////////////////////////////////////
const store = new MongoDBSession({
  uri: process.env.mongo_URI,
  collection: 'mySessions'
})
/////////////////////////////////////////////////////////////////////

//////// Middlewares ////////
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(session({
    key: 'user_sid',
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,  
    store: store,  
    cookie: { maxAge: 1000*60*60 }  // 1 hora
}))

//////// Passport ////////



app.get('/', (req, res) => {   
  res.render('login');
})

app.get('/register', (req, res) => {  
  res.render('register');
})

app.post('register', (req, res) => { 

})

app.get('/dashboard', (req, res) => {  
  res.render('dashboard');
})

app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
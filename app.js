require('dotenv').config()

const bcrypt = require('bcryptjs')
const express = require('express')
const session = require("express-session");
const mongoose = require('mongoose')
const MongoDBSession = require('connect-mongodb-session')(session)
const cookieParser = require("cookie-parser");
const passport = require('passport');
const localStrategy = require('passport-local').Strategy

const UserModel = require('./models/user.model');
const { rawListeners } = require('./models/user.model');

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
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
  UserModel.findById(id, function (err, user) {
    done(err, user)
  })
})

passport.use(new localStrategy(function (username, password, done) {
	UserModel.findOne({ username: username }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect username.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });
			
			return done(null, user);
		});
	});
}));

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

app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
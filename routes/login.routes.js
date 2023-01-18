const { Router } = require('express');
const router = Router();
const passport = require('passport');
const UserModel = require('../models/user.model')

const { isLoggedIn, isLoggedOut } = require('../services/logged')

///////  LOGGER///////////////
const { logger_info } = require('../logger/log_config');

router.get('/', isLoggedIn, (req, res) => {   

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = req.user;    
  res.render('dashboard', response); 
})

router.get('/register', isLoggedOut, (req, res) => {
  
  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = {
    error: req.query.error,
    msg: req.query.msg
   }
  res.render('register', response);
})

router.get('/login', isLoggedOut, (req, res) => {  

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);  

  const response = {
   error: req.query.error
  }

  res.render('login', response);
})

router.post('/register', async (req, res) => { 

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

router.post('/login', passport.authenticate('local', {
  
  successRedirect: '/',
  failureRedirect: '/login?error=true'
}))

router.get('/logout', function (req, res, next) {

  logger_info.info(`Ruta ${req.method} - "${req.hostname}:${req.socket.localPort}${req.baseUrl}" accedida`);
  
	req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;
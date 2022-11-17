require('dotenv').config()

const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserModel = require('../models/user.model')

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("Respuesta de Google")        
    console.log(profile)
    return cb(null, profile)
  }
));

passport.serializeUser((user, done)=>{
  done(null, user)
})

passport.deserializeUser((user, done)=>{
  done(null, user)
})
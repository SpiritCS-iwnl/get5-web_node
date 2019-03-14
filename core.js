const cfg = require('./config.json')
var express = require('express')
var session = require('express-session')
const passport = require('passport')
const SteamStrategy = require('passport-steam')
var mysql = require('mysql');
const axios = require('axios')

const app = express()

passport.use(new SteamStrategy({
    returnURL: 'http://' + cfg.web.url + ':' + cfg.web.port + '/auth/steam',
    realm: 'http://' + cfg.web.url + ':' + cfg.web.port + '/',
    apiKey: cfg.steam.token
  }, function(identifier, profile, done) {
    process.nextTick(function () {

    // To keep the example simple, the user's Steam profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Steam account with a user record in your database,
    // and return that user instead.
    profile.identifier = identifier;
    return done(null, profile);
  });
}));

var con = mysql.createConnection({
  host: cfg.mysql.host,
  user: cfg.mysql.user,
  password: cfg.mysql.password,
  database: cfg.mysql.db
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(identifier, done) {
   // For this demo, we'll just return an object literal since our user
    // objects are this trivial.  In the real world, you'd probably fetch
    // your user object from your database here.
    done(null, identifier);
});

app.use(session({
  secret: cfg.express.session_key,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth',
  passport.authenticate('steam'),
  function(req, res) {
});

app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});

app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    res.send(req.user)
  }else{
    res.redirect('/login');
  }
})

app.get('/login', function (req, res) {
  res.redirect('/auth');
})

app.get('/insert', ensureAuthenticated, function(req, res){
  let sql = 'INSERT INTO `user`(`steamid`, `name`, `img`, `open`, `rank\`) VALUES ("'+ req.user._json.steamid +'" , "'+ req.user.displayName +'" , "'+ req.user.photos[2].value +'" , 0, 0)';
  con.query(sql)
  res.send(sql)
});

app.listen(3000)

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}
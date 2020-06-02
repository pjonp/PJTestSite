const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, db) {


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  };

  app.route('/login')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index');
    });

  app.get("/auth/twitch", passport.authenticate("twitch", {
    forceVerify: true
  }));

  app.route('/auth/twitch/callback/').get(passport.authenticate('twitch', {
    failureRedirect: '/login'
  }), (req, res) => {
    res.redirect('/')
  })

  app.get("/auth/discord", passport.authenticate("discord", {
    forceVerify: true
  }));

  app.route('/auth/discord/callback/').get(passport.authenticate('discord', {
    failureRedirect: '/login'
  }), (req, res) => {
    res.redirect('/')
  })

  app
    .route('/')
    .get(ensureAuthenticated, (req, res) => {
      //  console.log('req.user ?!?', req.user);
      res.render(process.cwd() + '/views/pug/profile', {
        t_id: req.user.t_id,
        t_name: req.user.t_name,
        t_image: req.user.t_image,
        d_connected: req.user.d_id ? true : false,
        d_discriminator: req.user.d_discriminator,
        d_id: req.user.d_id,
        d_image: req.user.d_image,
        d_name: req.user.d_name
      });
    });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/login');
    });

}

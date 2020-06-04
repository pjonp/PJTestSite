const passport = require('passport'),
    ObjectID = require('mongodb').ObjectID,
    fetch = require('node-fetch');

module.exports = (app, db, cryptr) => {

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  };

  app.route('/login')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/login', {
        removed: req.query.removed
      });
    });

  app.route('/auth/twitch/').get(passport.authenticate('twitch', {
    forceVerify: false
  }));

  app.route('/auth/twitch/callback/').get(passport.authenticate('twitch', {
    failureRedirect: '/login'
  }), (req, res) => {
    res.redirect('/')
  })

  app.route('/auth/discord/').get(passport.authenticate('discord', {
    forceVerify: true
  }));

  app.route('/auth/discord/callback/').get(passport.authenticate('discord', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/')
  })

  app.route('/')
    .get(ensureAuthenticated, (req, res) => {
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

  app.route('/remove')
    .get((req, res, next) => {
      db.collection('userdata').findOneAndDelete({
        _id: ObjectID(req.session.passport.user)
      }, (error, result) => {
        if (error) {
          console.error('err', error);
        } else if (result) {
          let temp = cryptr.decrypt(result.value.t_at)
          fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.TWITCH_CLIENT_ID}&token=${temp}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
            }).catch(error => console.error(`Error Removing Token`));
        }
        console.log('Account Removed');
        next();
      });
    }, (req, res) => {
      req.logout();
      res.redirect('/login?removed=true');
    });
};

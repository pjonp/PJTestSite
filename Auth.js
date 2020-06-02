const session = require('express-session'),
  passport = require('passport'),
  bcrypt = require('bcrypt'),
  fetch = require('node-fetch'),
  Cryptr = require('cryptr'),
  ObjectID = require('mongodb').ObjectID,
  LocalStrategy = require('passport-local'),
  TwitchStrategy = require("@d-fischer/passport-twitch").Strategy;

module.exports = function(app, db) {

  let cryptr = new Cryptr(process.env.SECRET);

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  //!!!
  passport.use(new TwitchStrategy({
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: process.env.TWITCH_CALLBACK
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('a', accessToken)
      //  console.log('b', profile)
      //  console.log('d',cryptr.encrypt(refreshToken));
      fetch(`https://id.twitch.tv/oauth2/revoke?client_id=${process.env.TWITCH_CLIENT_ID}&token=${accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
        })
        .catch(error => console.error(`Error Removing Token`));

      db.collection('userdata').findOne({
        t_id: profile.id
      }, function(err, user) {
        console.log('User ' + profile.display_name + ' attempted to log in.');
        if (err) {
          done(null, false);
        } else if (user) {
          done(null, user);
        } else {
          db.collection('userdata').insertOne({
              t_id: profile.id,
              t_name: profile.display_name,
              t_image: profile.profile_image_url
            },
            (err, doc) => {
              if (err) {
                done(null, false);
              } else {
                done(null, doc.ops[0]);
              }
            });
        }
      });
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('userdata').findOne({
        _id: new ObjectID(id)
      },
      (err, doc) => {
        done(null, doc);
      }
    );
  });

};

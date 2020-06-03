const session = require('express-session'),
  passport = require('passport'),
  bcrypt = require('bcrypt'),
  fetch = require('node-fetch'),
  Cryptr = require('cryptr'),
  ObjectID = require('mongodb').ObjectID,
  LocalStrategy = require('passport-local'),
  TwitchStrategy = require("@d-fischer/passport-twitch").Strategy,
  DiscordStrategy = require('passport-discord').Strategy;

module.exports = function(app, db) {

  let cryptr = new Cryptr(process.env.SECRET);

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  //!!! TWITCH
  passport.use(new TwitchStrategy({
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: process.env.TWITCH_CALLBACK,
      scope: 'clips:edit'
    },
    function(accessToken, refreshToken, profile, done) {
      db.collection('userdata').findOneAndUpdate({
        t_id: profile.id
      }, {
        $set: {
          t_name: profile.display_name,
          t_image: profile.profile_image_url,
          t_at: cryptr.encrypt(accessToken),
          t_rt: cryptr.encrypt(refreshToken)
        }
      }, {
        returnOriginal: false
      }, (error, result) => {
        if (error) {
          console.log('err', error);
          done(null, false);
        } else if (!result.value) {
          db.collection('userdata').insertOne({
              t_id: profile.id,
              t_name: profile.display_name,
              t_image: profile.profile_image_url,
              t_at: cryptr.encrypt(accessToken),
              t_rt: cryptr.encrypt(refreshToken)
            },
            (err, doc) => {
              if (err) {
                done(null, false);
              } else {
                done(null, doc.ops[0]);
              }
            });
        } else {
          done(null, result.value);
        }
      });

    }
  ));

  //!!! DISCORD
  passport.use(new DiscordStrategy({
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK,
      scope: ['identify'],
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {

      db.collection('userdata').findOneAndUpdate({
        _id: ObjectID(req.session.passport.user)
      }, {
        $set: {
          d_id: profile.id,
          d_name: profile.username,
          d_discriminator: profile.discriminator,
          d_image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}?size=512` : `https://cdn.discordapp.com/embed/avatars/0.png`
        }
      }, {
        returnOriginal: false
      }, (error, result) => {
        if (error) {
          console.log('err', error);
          done(null, false);
        } else {
          done(null, result.value);
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

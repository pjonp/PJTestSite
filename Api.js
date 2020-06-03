module.exports = function(app, db) {

  app.route('/api/twitchid/:userid')
    .get((req, res, next) => {
      db.collection('userdata').findOne({
        d_id: req.params.userid
      }, (error, data) => {
        if (error || !data) {
          if (error) console.log(error, 'MONGO ERROR!');
          res.locals.userData = {
            error: 'User Not Found'
          };
        } else {
          res.locals.userData = {
            t_id: data.t_id
          };
        };
        next();
      })
    }, (req, res) => {
      res.json(res.locals.userData);
    });

  app.route('/api/discordid/:userid')
    .get((req, res, next) => {
      db.collection('userdata').findOne({
        t_id: req.params.userid
      }, (error, data) => {
        if (error || !data) {
          if (error) console.log(error, 'MONGO ERROR!');
          res.locals.userData = {
            error: 'User Not Found'
          };
        } else if(!data.d_id){
          res.locals.userData = {
            error: 'User Has Not Verified Discord Account'
          };
        } else {
          res.locals.userData = {
            d_id: data.d_id
          };
        };
        next();
      })
    }, (req, res) => {
      res.json(res.locals.userData);
    });

  app.route('/api/clipinfo/:userid')
    .get((req, res, next) => {
      db.collection('userdata').findOne({
        t_id: req.params.userid
      }, (error, data) => {
        if (error || !data) {
          if (error) console.log(error, 'MONGO ERROR!');
          res.locals.userData = {
            error: 'User Not Found'
          };
        } else {
          res.locals.userData = {
            d_id: data.d_id,
            t_token: data.t_at
          };
        };
        next();
      })
    }, (req, res) => {
      res.json(res.locals.userData);
    });



}; //module

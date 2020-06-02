const routes = require('./Routes.js'),
  auth = require('./Auth.js'),
  envvars = require('dotenv').config(),
  express = require('express'),
  bodyParser = require('body-parser'),
  mongo = require('mongodb').MongoClient,
  app = express(),
  helmet = require('helmet')

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'static-cdn.jtvnw.net', 'cdn.discordapp.com'],
    styleSrc: ["'self'", 'fonts.googleapis.com'],
    fontSrc: ["'self'", 'fonts.gstatic.com'],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"]
  }
}))
app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

mongo.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    let db = client.db('pjtestsite');

    auth(app, db)
    routes(app, db)

    //LAST ROUTE
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});

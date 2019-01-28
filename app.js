require('dotenv').config();

const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');

const views = require('./routes/views');
const api = require('./routes/api');

// initialize express app
const app = express();
app.set('view engine', 'hbs');

// set POST request body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect to db
const url = process.env.MONGO_SRV;
mongoose.connect(url, {useNewUrlParser: true}, function (err) {
  if (err) {
    console.log("MongoDB connection error:");
    console.log(err);
  } else {
    console.log("MongoDB connected");
  }
});

// set up sessions
app.use(session({
	secret: 'session-secret',
	resave: 'false',
	saveUninitialized: 'true'
}));

app.use('/', views);
app.use('/api', api);
app.use('/static', express.static('public'));

// 404 route
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// route error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    status: err.status,
    message: err.message,
  });
});

// port config
const port = 3000; // config variable
const server = http.Server(app);

server.listen(port, function() {
  console.log('Server running on port: ' + port);
});

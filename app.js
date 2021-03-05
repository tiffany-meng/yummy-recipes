var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var viewLibrary = require('./routes/viewLibrary');
var app = express();

app.set('port', process.env.PORT || 3500);
app.set('views', path.join(__dirname, 'views'));

var hbs = handlebars.create({
  // Specify helpers which are only registered on this instance.
  helpers: {
    grouped_each: function(every, context, options) {
      var out = "", subcontext = [], i;
      if (context && context.length > 0) {
          for (i = 0; i < context.length; i++) {
              if (i > 0 && i % every === 0) {
                  out += options.fn(subcontext);
                  subcontext = [];
              }
              subcontext.push(context[i]);
          }
          out += options.fn(subcontext);
      }
      return out;
    },
    if_even: function(conditional, options) {
      if((conditional % 2) == 0) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    if_odd: function(conditional, options) {
      if((conditional % 2) != 0) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    if_string_equal: function(string1, string2, options) {
      if (string1 == string2) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    for: function(n, block) {
      var accum = '';
      for(var i = 0; i < n; ++i)
          accum += block.fn(i);
      return accum;
    }
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));
app.locals.authTokens = {};
app.locals.badAuth = false;

app.use((req, res, next) => {
  const authToken = req.cookies['AuthToken'];
  req.user = app.locals.authTokens[authToken];
  next();
});

app.get('/', viewLibrary.login);
app.get('/home', viewLibrary.home);
app.get('/cuisine/:id', viewLibrary.cuisine_list);
app.get('/library', viewLibrary.saved_recipes);
app.get('/preferences', viewLibrary.preferences);
app.get('/recipe/:id', viewLibrary.recipe);
app.post('/', viewLibrary.loginAttempt);
app.post('/signup', viewLibrary.signup);
app.post('/logout', viewLibrary.logout);
app.post('/updatepreferences/:pref', viewLibrary.updatepreferences);
app.post('/updatesavestatus/:id', viewLibrary.updatesavestatus);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
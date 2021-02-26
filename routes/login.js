var users = require('../users.json');
/*
 * GET home page.
 */

exports.view = function(req, res){
  res.render('login', {users: encodeURIComponent(JSON.stringify(users))});
};
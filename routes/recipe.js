var data = require('../data.json');
/*
 * GET home page.
 */

exports.view = function(req, res){
    var myId = req.params.id;
    var name = getRecipeName(myId);
    var cat = getCategoryId(myId);
    res.render('recipe', {page: "home", name: name, catId: cat});
  };

function getCategoryId(id) {
  return data.recipes.find(item=>{return item.id==id}).category;
}
function getRecipeName(id) {
  return data.recipes.find(item=>{return item.id==id}).name;
}
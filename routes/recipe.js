var data = require('../data.json');
/*
 * GET home page.
 */

exports.view = function(req, res){
    var id = req.params.id;
    var name = getRecipeName(id);
    var cat = getCategoryId(id);
    res.render('recipe', {page: "home", name: name, category: cat});
  };

function getCategoryId(id) {
  return data.recipes.find(item=>{return item.id==id}).category;
}
function getRecipeName(id) {
  return data.recipes.find(item=>{return item.id==id}).name;
}
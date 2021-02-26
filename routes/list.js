var data = require('../data.json');
/*
 * GET home page.
 */

exports.view = function(req, res){
    var id = req.params.id;
    var filteredData = filterData(id);
    var category = getCategory(id);
    res.render('list', {
      page: "home",
      data: filteredData,
      category: category,
    });
};

function filterData(id) {
  return data.recipes.filter(item=>item.category==id);
}

function getCategory(id) {
  return data.categories.find(item => {return item.id == id}).name;
}
var users = require('../users.json');
var data = require('../data.json');

exports.login = function(req, res){
    res.render('login', {users: encodeURIComponent(JSON.stringify(users))});
};

exports.home = function(req, res){
    res.render('index', {
        data: data,
        page: "home",
    });
};

exports.cuisine_list = function(req, res){
    var id = req.params.id;
    var filteredData = filterDataByCategory(id);
    var category = getCategoryByID(id);
    res.render('list', {
      page: "home",
      data: filteredData,
      category: category.name,
    });
};

exports.saved_recipes = function(req, res){
    res.render('library', {page: "library"});
};

exports.search = function(req, res){
    res.render('search', {page: "search"});
};

exports.preferences = function(req, res){
    res.render('preferences', {page: "preferences"});
};

exports.recipe = function(req, res){
    var id = req.params.id;
    var recipe = getRecipeByID(id);
    res.render('recipe', {page: "home", name: recipe.name, category: recipe.category});
};

// Helper functions to filter data
function filterDataByCategory(id) {
    return data.recipes.filter(item=>item.category==id);
}
  
function getCategoryByID(id) {
    return data.categories.find(item => {return item.id == id});
}

function getRecipeByID(id) {
    return data.recipes.find(item=>{return item.id==id});
}
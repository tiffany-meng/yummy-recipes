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
    let id = req.params.id;
    let filteredData = filterDataByCategory(id);
    let truncatedData = filteredData.map(item => {
        let obj = Object.assign({}, item);
        obj.name = truncateLongName(item.name)
        return obj;
    });
    let category = getCategoryByID(id);
    res.render('list', {
      page: "home",
      data: truncatedData,
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
    let id = req.params.id;
    let recipe = getRecipeByID(id);
    res.render('recipe', {page: "home", id: id, name: recipe.name, category: recipe.category});
};

exports.saveRecipe = function(req, res) {
    console.log("entering save recipe function");
}

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

function truncateLongName(name) {
    if (name.length > 12) {
        return name.substring(0,12).trim() + "...";
    } else {
        return name;
    }
}
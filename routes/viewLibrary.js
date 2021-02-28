const Fuse = require('fuse.js');
var users = require('../data/users.json');
var data = require('../data/data.json');
var currentUser;

exports.login = function(req, res){
    if (req.query.account == "created") {
        res.render('login', {
            failed: false,
            signupsuccess: true
        });
    } else {
        res.render('login', {
            failed: false,
            signupsuccess: false
        });
    }
};

exports.home = function(req, res) {
    let filteredData = data.categories;
    if (req.query.search != undefined && req.query.search != '') {
        filteredData = findCategorySearchMatches(req.query.search);
    }
    res.render('index', {
        data: filteredData,
        page: "home",
    });
};

exports.loginAttempt = function(req, res) {
    let passed_username = req.body.username;
    let passed_password = req.body.password;
    let userResult = users.users.find(({username})=>{return username.trim()==passed_username.trim()});
    if(userResult != undefined) {
        if(passed_password==userResult.password) {
            currentUser = userResult;
            res.redirect('/home')
        } else {
            res.render('login', {
                failed: true
            });
        }
    } else {
        res.render('login', {
            failed: true
        });
    }
}

exports.signup = function(req, res) {
    if (req.body.login == "true") {
        res.render('signup', {
            failed: false,
            errorMsg: undefined
        });
    } else {
        let passed_username = req.body.username;
        let passed_password = req.body.password;
        let passed_password2 = req.body.password2;
        if (passed_username == '' || passed_password == '' || passed_password2 == '') {
            res.render('signup', {
                failed: true,
                errorMsg: "Fill all fields to create an account!"
            })
        } else {
            let userResult = users.users.find(({username})=>{return username.trim()==passed_username.trim()});
            if (passed_password != passed_password2) {
                res.render('signup', {
                    failed: true,
                    errorMsg: "Passwords do not match!"
                })
            } else if (userResult != undefined) {
                res.render('signup', {
                    failed: true,
                    errorMsg: "Username already taken!"
                })
            } else {
                users.users.push({
                    "username" : passed_username,
                    "password" : passed_password,
                    "saved_recipes" : [],
                    "preferences" : []
                })
                res.redirect('/?account=created');
            }
        }
    }
}

exports.cuisine_list = function(req, res){
    let id = req.params.id;
    let filteredData = filterDataByCategory(id);
    filteredData.sort(function(a, b) {
        return a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1;
    })
    if (req.query.search != undefined && req.query.search != '') {
        filteredData = findRecipeSearchMatches(req.query.search, filteredData);
    }
    let truncatedData = filteredData.map(item => {
        let obj = Object.assign({}, item);
        obj.name = truncateLongName(item.name)
        return obj;
    });
    let category = getCategoryByID(id);
    res.render('list', {
      id: id,
      page: "home",
      data: truncatedData,
      category: category.name,
    });
};

exports.saved_recipes = function(req, res){
    let userIndex = users.users.findIndex(item => {return item.username==currentUser.username});
    let savedRecipes = users.users[userIndex].saved_recipes;
    let empty = savedRecipes.length == 0 ? true : false; 
    res.render('library', {page: "library", recipes: savedRecipes, empty: empty});
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
    let id = req.params.id;
    let recipe = getRecipeByID(id);
    let userIndex = users.users.findIndex(item => {return item.username==currentUser.username});
    users.users[userIndex].saved_recipes.push(recipe);
    res.render('recipe',  {page: "home", id: id, name: recipe.name, category: recipe.category});
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
    if (name.length > 14) {
        return name.substring(0,14).trim() + "...";
    } else {
        return name;
    }
}

function findCategorySearchMatches(searchString) {
    const fuse = new Fuse(data.categories, {
        keys: ['name']
    })
    const result = fuse.search(searchString);
    return result.map(item => item.item);
}

function findRecipeSearchMatches(searchString, data) {
    const fuse = new Fuse(data, {
        keys: ['name', 'img']
    })
    const result = fuse.search(searchString);
    return result.map(item=>item.item);
}
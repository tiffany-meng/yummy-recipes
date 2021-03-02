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
    let url = req.path;
    let path = url.split("/")[1];
    let backPath;
    let id = req.params.id;
    let recipe = getRecipeByID(id);

    if(path == "recipe") {
        backPath = `/cuisine/${recipe.category}`;
    } else {
        backPath = "/library";
    }
    let userIndex = users.users.findIndex(item => {return item.username==currentUser.username});
    let saved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});

    console.log(backPath);
    res.render('recipe', {page: "home", id: id, recipe: recipe, saved: saved==-1?false:true, backPath: backPath});
};

exports.saveRecipe = function(req, res) {
    let backPath = req.body.backPath;
    let id = req.params.id;
    let recipe = getRecipeByID(id);
    let userIndex = users.users.findIndex(item => {return item.username==currentUser.username});
    let alreadySaved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});
    if(alreadySaved != -1) {
        console.log("already saved, removing..");
        users.users[userIndex].saved_recipes.splice(alreadySaved,1);
    } else {
        console.log("not saved, saving..");
        users.users[userIndex].saved_recipes.push(recipe);
    }

    let path = backPath.split("/")[1];
    let fromSave;

    if(path == "cuisine") {
        fromSave = false;
    } else {
        fromSave = true;
    }

    if(fromSave) {
        res.redirect(`/savedrecipe/${id}`);
    } else {
        res.redirect(`/recipe/${id}`);
    }
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
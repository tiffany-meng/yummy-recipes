var Fuse = require('fuse.js');
var crypto = require('crypto');

var users = require('../data/users.json');
var categories = require('../data/categories.json');
var recipes = require('../data/recipes.json');

exports.login = function(req, res){
    if (req.app.locals.badAuth) {
        res.render('login', {
            failed: true,
            msg: "Sign in required",
            signupsuccess: false
        });
    } else if (req.query.account == "created") {
        res.render('login', {
            failed: false,
            msg: "Account created successfully!",
            signupsuccess: true
        });
    } else {
        res.render('login', {
            failed: false,
            msg: "",
            signupsuccess: false
        });
    }
};

exports.home = function(req, res) {
    if (req.user) {
        let filteredData = categories.categories;
        if (req.query.search != undefined && req.query.search != '') {
            filteredData = findCategorySearchMatches(req.query.search);
        }
        res.render('index', {
            data: filteredData,
            page: "home",
        });
    } else {
        req.app.locals.badAuth = true;
        res.redirect('/');
    }
};

exports.loginAttempt = function(req, res) {
    let { username, password } = req.body;
    let userResult = users.users.find( (u) => {
        return u.username.trim() == username.trim() && u.password.trim() == password.trim();
    });
    
    if (userResult != undefined) {
        let authTokens = req.app.locals.authTokens;
        let authToken = generateAuthToken();
        authTokens[authToken] = userResult;
        res.cookie('AuthToken', authToken);
        req.app.locals.badAuth = false;
        res.redirect('/home');
    } else {
        res.render('login', {
            failed: true,
            msg: "Incorrect login credentials",
            signupsuccess: false
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
        let {username, password, password2} = req.body;
        if (username == '' || password == '' || password2 == '') {
            res.render('signup', {
                failed: true,
                errorMsg: "Fill all fields to create an account!"
            })
        } else {
            let userResult = users.users.find(({u})=>{return u.trim() == username.trim()});
            if (password != password2) {
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
                    "username" : username,
                    "password" : password,
                    "saved_recipes" : [],
                    "preferences" : []
                })
                res.redirect('/?account=created');
            }
        }
    }
}

exports.cuisine_list = function(req, res){
    if (req.user) {
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
    } else {
        res.locals.badAuth = true;
        res.redirect('/');
    }
};

exports.saved_recipes = function(req, res){
    if (req.user) {
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username});
        let savedRecipes = users.users[userIndex].saved_recipes;
        let empty = savedRecipes.length == 0; 
        res.render('library', {page: "library", recipes: savedRecipes, empty: empty});
    } else {
        res.redirect('/');
    }

};

exports.preferences = function(req, res){
    if (req.user) {
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username})
        let prefArray = users.users[userIndex].preferences;
        let lowcal = findPreference('lowcal', prefArray);
        let hical = findPreference('hical', prefArray);
        let gf = findPreference('gf', prefArray);
        let df = findPreference('df', prefArray);
        let vegan = findPreference('vegan', prefArray);
        let veg = findPreference('veg', prefArray);
        let hip = findPreference('hip', prefArray);
        let lowcarb = findPreference('lowcarb', prefArray);
        let price1 = findPreference('price1', prefArray);
        let price2 = findPreference('price2', prefArray);
        let price3 = findPreference('price3', prefArray);
        let price4 = findPreference('price4', prefArray);
        let x30mins = findPreference('30mins', prefArray);
        let x1hr = findPreference('1hr', prefArray);
        let x2hr = findPreference('2hr', prefArray);

        res.render('preferences', {
            page: "preferences",
            lowcal: lowcal,
            hical: hical,
            gf: gf,
            df: df,
            vegan: vegan,
            veg: veg,
            hip: hip,
            lowcarb: lowcarb,
            price1: price1,
            price2: price2,
            price3: price3,
            price4: price4,
            x30mins: x30mins,
            x1hr: x1hr,
            x2hr: x2hr
        });
    } else {
        res.redirect('/');
    }
};

exports.recipe = function(req, res){
    if (req.user) {
        let path = req.path.split("/")[1];
        let backPath;
        let id = req.params.id;
        let recipe = getRecipeByID(id);
    
        if(path == "recipe") {
            backPath = `/cuisine/${recipe.category}`;
        } else {
            backPath = "/library";
        }

        let userIndex = users.users.findIndex(item => {return item.username==req.user.username});
        let saved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});
    
        res.render('recipe', {
            page: "home", 
            id: id, 
            recipe: recipe, 
            saved: saved!=-1, 
            backPath: backPath
        });
    } else {
        res.redirect('/');
    }
};

exports.saveRecipe = function(req, res) {
    if (req.user) {
        let backPath = req.body.backPath;
        let id = req.params.id;
        let recipe = getRecipeByID(id);
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username});
        let alreadySaved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});
        if(alreadySaved != -1) {
            users.users[userIndex].saved_recipes.splice(alreadySaved,1);
        } else {
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
    } else {
        res.redirect('/');
    }
}

exports.logout = function(req, res) {
    let authTokens = req.app.locals.authTokens;
    let authToken = req.cookies['AuthToken'];
    authTokens[authToken] = null;
    res.clearCookie('AuthToken');
    res.redirect('/');
}

exports.togglePref = function(req, res) {
    if (req.user) {
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username})
        let toggledPref = req.params.pref;
        users.users[userIndex].preferences = togglePreference(toggledPref, users.users[userIndex].preferences);
        res.redirect('/preferences');
    } else {
        res.redirect('/');
    }
}

// Helper functions to filter data
function findPreference(preference, prefArray) {
    let result = prefArray.findIndex(item => {return item==preference});
    return result != -1;
}
function togglePreference(toggledPref, prefArray) {
    let result = prefArray.findIndex(item => {return item==toggledPref});
    if (result != -1) {
        prefArray.splice(result, 1);
        console.log("removing from preferences")
    } else {
        prefArray.push(toggledPref);
        console.log("adding to preferences");
    }
    return prefArray;
}

function filterDataByCategory(id) {
    return recipes.recipes.filter(item=>item.category==id);
}
  
function getCategoryByID(id) {
    return categories.categories.find(item => {return item.id == id});
}

function getRecipeByID(id) {
    return recipes.recipes.find(item=>{return item.id==id});
}

function truncateLongName(name) {
    if (name.length > 14) {
        return name.substring(0,14).trim() + "...";
    } else {
        return name;
    }
}

function findCategorySearchMatches(searchString) {
    const fuse = new Fuse(categories.categories, {
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

function generateAuthToken() {
    return crypto.randomBytes(30).toString('hex');
}
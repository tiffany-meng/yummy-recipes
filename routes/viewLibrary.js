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
    } else if (req.query.newuser != undefined) {
        res.render('login', {
            failed: false,
            msg: `Account created for ${req.query.newuser}!`,
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
            let userResult = users.users.find((u)=>{return u.username.trim() == username.trim()});
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
                    "preferences" : {
                        "diet" : {
                            "lowcal" : {
                                "label": "Low Cal",
                                "value" : false
                            },
                            "hical" : {
                                "label": "High Cal",
                                "value" : false
                            },
                            "gf" : {
                                "label": "Gluten Free",
                                "value" : false
                            },
                            "df" : {
                                "label": "Dairy Free",
                                "value" : false
                            },
                            "vegan" : {
                                "label": "Vegan",
                                "value" : false
                            },
                            "veg" : {
                                "label": "Vegetarian",
                                "value" : false
                            },
                            "hip" : {
                                "label": "High Protein",
                                "value" : false
                            },
                            "lowcarb" : {
                                "label": "Low Carb",
                                "value" : false
                            }
                        }, 
                        "price" : {
                            "price1" : {
                                "label": "$",
                                "value" : false
                            },
                            "price2" : {
                                "label": "$$",
                                "value" : false
                            },
                            "price3" : {
                                "label": "$$$",
                                "value" : false
                            },
                            "price4" : {
                                "label": "$$$$",
                                "value" : false
                            }
                        }, 
                        "time" : {
                            "30mins" : {
                                "label": "<30 mins",
                                "value" : false
                            },
                            "1hr" : {
                                "label": "~1 hr",
                                "value" : false
                            },
                            "2hr" : {
                                "label": "<2 hrs",
                                "value" : false
                            }
                        }
                    }
                })
                res.redirect(`/?newuser=${username.trim()}`);
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
        res.render('preferences', {
            page: "preferences",
            preferences: users.users[userIndex].preferences
        });
    } else {
        res.redirect('/');
    }
};

exports.recipe = function(req, res){
    if (req.user) {
        let path = req.headers.referer.split("/")[3];
        let id = req.params.id;
        let recipe = getRecipeByID(id);
        if(path == "cuisine") {
            page = "home";
        } else {
            page = "library";
        }
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username});
        let saved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});
        res.render('recipe', {
            page: page, 
            id: id, 
            recipe: recipe, 
            saved: saved!=-1
        });
    } else {
        res.redirect('/');
    }
};

exports.logout = function(req, res) {
    let authTokens = req.app.locals.authTokens;
    let authToken = req.cookies['AuthToken'];
    authTokens[authToken] = null;
    res.clearCookie('AuthToken');
    res.redirect('/');
}

exports.updatepreferences = function(req, res) {
    if (req.user) {
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username})
        let path = req.params.pref.split('-');
        let category = path[0];
        let preference = path[1];
        users.users[userIndex].preferences[category][preference].value =  !users.users[userIndex].preferences[category][preference].value;
        res.redirect('/preferences');
    } else {
        res.redirect('/');
    }
}

exports.updatesavestatus = function(req, res) {
    if (req.user) {
        let id = req.params.id;
        let recipe = getRecipeByID(id);
        let userIndex = users.users.findIndex(item => {return item.username==req.user.username});
        let alreadySaved = users.users[userIndex].saved_recipes.findIndex(item => {return item==recipe});
        if(alreadySaved != -1) {
            console.log('removing like')
            users.users[userIndex].saved_recipes.splice(alreadySaved,1);
        } else {
            console.log('adding like')
            users.users[userIndex].saved_recipes.push(recipe);
        }
        res.redirect(`recipe/${id}`);
    } else {
        res.redirect('/');
    }
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
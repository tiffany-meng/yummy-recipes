var data = require('../data.json');
/*
 * GET home page.
 */

exports.view = function(req, res){
    var myId = req.params.id;
    var ourData = getCategoryData(myId);
    console.log(myId);
    res.render('list', {page: "home", data: encodeURIComponent(JSON.stringify(data)), data2: ourData});
  };

function getCategoryData(id) {
  return data.recipes.filter(item=>item.category==id);
}

/*
 * GET home page.
 */

exports.view = function(req, res){
    var id = req.params.id;
    res.render('foodPage');
  };
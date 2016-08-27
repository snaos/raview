var express = require('express');
var router = express.Router();

var db_raview= require('../models/db_manager');
var password = 'raviewme5';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('manager', { title: 'manager page' });
});

router.get('/review_list',function(req,res,next){
  res.redirect('review_list/1');
})

router.get('/review_list/:page',function(req, res){
    var page = req.params.page;
    page = parseInt(page, 10);
    db_raview.review_list(page, function(datas){

    });
});

//email 로그인 요청시
router.post('/manager_login', function (req, res) {
    var pw = req.body.password;

    if(pw == password){
        res.redirect('review_list');
    } else {
        res.send('<script>alert("wrong password!!");history.back();</script>') //history.back() == 이전 페이지로
    }
});


module.exports = router;

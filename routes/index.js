var express = require('express');
var router = express.Router();

var db_raview_user = require('../models/db_user');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'login' });
});

router.get('/test',function(req,res,next){
  res.render('profile',{title:'문제'});
})
router.get('/upload',function(req,res,next){
  res.render('upload',{title:'문제'});
})


//email 로그인 요청시
router.post('/login_in_page', function (req, res) {
    var email = req.body.profile_email;
    var pw = req.body.profile_password;
    var datas = [email, pw];
    console.log('login datas', datas);
    db_raview_user.login_in_page(datas, function (results) {
        req.session.user_num = results.results.profile_num;    //profile_num이 있을 경우 세션에 로그인 된 이메일 저장
        if(results.message == 'login success'){
            res.redirect('upload');
        } else {
            res.send('<script>alert("로그인 실패!!");history.back();</script>') //history.back() == 이전 페이지로
        }
    });
});


module.exports = router;

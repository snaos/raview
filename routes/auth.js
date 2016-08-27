/**
 * Created by user on 2015-02-05.
 */

var express = require('express');
var router = express.Router();
var db_raview = require('../models/db_auth');
//메일
var nodemailer = require('nodemailer');

//var domain = '54.191.156.128/';
var domain = 'http://54.65.222.144/'

//메일 보내는 계정
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'raviewco@gmail.com',
        pass: 'raviewme5'
    }
});


//이메일 인증하기
router.get('/email_auth/:url', function (req, res) {

    var auth_url= req.params.url;

    db_raview.email_auth_update(auth_url, function (results) {
        res.redirect('/auth/ok')
        //res.render('email_auth', {'email':email});
        //res.json(results);
    });
});

router.get('/ok', function (req, res) {
    res.render('email_auth');
})



//이메일 인증 요청 확인
router.post('/email_auth_check', function (req, res) {
    var email = req.body.profile_email;

    db_raview.email_auth_check(email, function (results) {
        res.json(results);
    })
});

//gcm notification 수정 : 보류
router.post('/gcm_nf', function (req, res) {
    var user_num = req.session.user_num;

    res.josn({
        "success": 1,
        "message": "gcm 설정 ok"
    });
});

router.post('/forgot_password', function (req, res) {
    var email = req.body.profile_email;
    db_raview.sent_password(email, function (results) {
        console.log('results',results);
        if (results.message == "forgot password success") {
            var mailOptions = {
                from: '<raview>',
                to: email,
                subject: 'Reset your password',
                text: 'raview',
                html: 'Hello '+results.last +' '+results.first+', <br><br>'
                +'We received a request to reset your raview password<br>'
                +'associated with this email account.<br><br><table borker="1"><tr><td>'
                +'New Passwword : ' + results.pw + '</td></tr></table><br><br>'
                +'Thanks<br>Raview Team<br>'
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    res.json({
                        "success": 1,
                        "message": "send email fail"
                    })
                } else {
                    res.json(results);
                }
            });
        } else {
            res.json(results)
        }
    });
});

module.exports = router;
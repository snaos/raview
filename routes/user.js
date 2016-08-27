/*
 -todo
 gcm
 */

var express = require('express');
var router = express.Router();
var db_raview = require('../models/db_user');
var db_raview_member = require('../models/db_member');
var db_raview_auth = require('../models/db_auth');
var fbgraph = require('fbgraph');
var fs = require('fs-extra');

var nodemailer = require('nodemailer');

var domain = 'http://54.65.222.144/'

var max_image_size = 10485760;

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'raviewco@gmail.com',
        pass: 'raviewme5'
    }
});

validation_string = function (datas, callback) {
    if (datas) {
        var valid = true;
        for (var data in datas) {
            if (datas[data]===undefined) {
                valid = false;
            }
        }
        callback(valid);
    } else {
        callback(false);
    }
}

/* get home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'raview 유저관련 페이지'});
});

//email 로그인 요청시
router.post('/login', function (req, res) {
    console.log('/login req.session.id', req.session.id);
    var email = req.body.profile_email;
    var pw = req.body.profile_password;
    var gcm_data = req.body.regId;
    var datas = [email, pw];
    console.log('login datas',datas);
    validation_string(datas, function (val_string) {
        if (val_string) {
            db_raview.login(datas,gcm_data, function (results) {
                req.session.user_num = results.results.profile_num;    //profile_num이 있을 경우 세션에 로그인 된 이메일 저장
                console.log('results',results);
                res.json(results);
                console.log('/login2, req.session.id', req.session.id);
            });
        } else {
            var not_available_reulst = {
                "success": 1,
                "message": "data is invalid",
                "results": {"profile_num": -1}
            }
            res.json(not_available_reulst);
        }
    });
});


//페이스북 로그인 요청시
////
//router.post('/login_fb', function (req, res) {
//    var fb_token = req.body.profile_facebook_token;
//    fbpraph.setAccessToken(fb_token);
//    var datas = {};
//    /*      받아오는 형태
//     /me { id: '766974706718539',
//     email: 'snaos1@naver.com',
//     first_name: '성환',
//     gender: 'male',
//     last_name: '김',
//     link: 'https://www.facebook.com/app_scoped_user_id/766974706718539/',
//     locale: 'ko_KR',
//     name: '김성환',
//     timezone: 9,
//     updated_time: '2014-10-19T15:05:12+0000',
//     verified: true }
//     */
//    validation_string(fb_token, function (val_results) {
//        if (val_results) {
//            fbgraph.get('/me', function (err, me_res) {
//                if (err) {
//                    console.error('err', err);
//                    res.json({
//                        "success": 1,
//                        "message": "token error",
//                        "results": {
//                            "profile_num": -1
//                        }
//                    });
//                } else {
//                    datas = me_res;
//                    if (!datas.email) {
//                        datas.email = 'fb_' + Date.now();
//                    }
//                    db_raview.signup_fb(datas, function (results) {
//                        req.session.user_num = results.results.profile_num;    //세션에 로그인 된 이메일 저장
//                        res.json(results);
//                    });
//
//                }
//            });
//        } else {
//            var not_available_reulst = {
//                "success": 1,
//                "message": "data is invalid",
//                "results": {
//                    "profile_num": -1
//                }
//            }
//            res.json(not_available_reulst);
//        }
//    });
//});
//구글 로그인 요청시
router.post('/login_google', function (req, res) {

    var email = req.body.profile_email;
    var pw = req.body.profile_password;
    var google_token = req.body.profile_google_token;

    //db에서 email와 pw값, 토큰을 찾아 비교.
    /* db 구현 후
     db_raview.login_google(datas ,login_info, function(results) {
     if(results.success == 1){ //로그인 정보가 존재
     req.session.user_email = email;    //세션에 로그인 된 이메일 저장
     res.json({
     "success": 1,
     "message" : "ok",
     "result" : results
     });
     }
     else  {     //로그인 정보가 없음.
     res.json({
     "success":  0,
     "message": results.err
     });
     }
     }
     */
    //더미 데이터
    if (!email || !pw || !google_token) {
        res.json({"success": 0});
    } else {
        res.json({
            "success": 1,
            "message": "구글 로그인 ok",
            "result": {
                "profile_num": 25
            }
        });
    }
    //더미 데이터 끝
});

//로그아웃 요청시
router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.error('err', err);
            res.json({
                "success": 1,
                "message": "logout fail"
            })
        } else {
            res.json({
                "success": 1,
                "message": "logout success"
            });
        }
    });
});

//email 회원 가입
router.post('/signup', function (req, res) {
    //세션 처리
    var first_name = req.body.profile_first_name;
    var last_name = req.body.profile_last_name;
    var password = req.body.profile_password;
    var email = req.body.profile_email;
    var gender = req.body.profile_gender;
    var location = req.body.location_num;
    var birth = req.body.profile_birth;
    var gcm_token = req.body.regId;
    var datas = [first_name, last_name, password, email, gender, location, birth];

    validation_string(datas, function (val_string) {
        if (val_string) {
            db_raview.signup(datas, gcm_token,function (results) {
                req.session.user_num = results.results.profile_num;    //세션에 로그인 된 이메일 저장
                res.json(results);
            });
        } else {
            var callback_data = {};
            callback_data.results = {"profile_num": -1}
            callback_data.message = "data is invalid";
            callback_data.success = 1;
            res.json(callback_data);
        }
    })

    db_raview_auth.send_email(email, function (results) {
        //메일 옵션
        var mailOptions = {
                    from: '<raview>',
                    to: email,
                    subject: 'Confirm your email',
                    text: 'raview',
                    html: 'Welecom to raview! <br><br>'
                    +'To start using raview, please verify your email address by clicking the link below. <br><br><table borker="1"><tr><td>'
                        +'<a href= ' + domain + 'auth/email_auth/'+results.url+'>Verify email address</a></td></tr></table> <br><br>'
                    +'Thanks <br>Raview Team<br>'
                };


        //메일을 전송함
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) console.log(error);
        });
    });
});

//fb 회원 가입
router.post('/signup_fb', function (req, res) {
    //세션 처리
    var fb_token = req.body.profile_facebook_token;
    var gcm_token = req.body.regId;
    fbgraph.setAccessToken(fb_token);
    var datas = {};
    validation_string(fb_token, function (val_string) {
        if (val_string) {
            fbgraph.get('/me', function (err, me_res) {
                if (err) {
                    console.error('err', err);
                    res.json({
                        "success": 1,
                        "message": "token error",
                        "results": {
                            "profile_num": -1
                        }
                    });
                } else {
                    datas = me_res;
                    fbgraph.get('/me?fields=picture', function (err, pic_res) {
                        if (err) {
                            console.error('err', err)
                            res.json({
                                "success": 1,
                                "message": "token error",
                                "results": {
                                    "profile_num": -1
                                }
                            });
                        } else {
                            //res.picture.data.is_silhouette 가 true면 기본 이미지임. false면 사용자의 이미지
                            datas.image = pic_res.picture.data.url;
                            db_raview.signup_fb(datas, gcm_token,  function (results) {
                                req.session.user_num = results.results.profile_num;
                                console.log('req.session.user_num',req.session.user_num);
                                console.log('in fb, req.session.id',req.session.id);
                                res.json(results);
                            });
                        }
                    });
                }
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is invalid",
                "results": {
                    "profile_num": -1
                }
            });
        }
    })
});

//google 회원 가입
router.post('/signup_google', function (req, res) {
    //세션 처리


    var google_token = req.body.profile_google_token;

    /*디비 연동시
     db_raview.signup_google(datas, function (results) {
     if(results.success){
     req.session.user_email = email;    //세션에 로그인 된 이메일 저장
     res.json({
     "success": 1,
     "message": "ok",
     "results": results
     });
     } else {
     res.json({
     "success": 0,
     "message": results.err
     });
     }
     });
     */

    //더미 데이터

    res.json({
        "success": 1,
        "message": "google 회원가입 ok",
        "result": {
            "profile_num": 25
        }
    });

});


//회원 정보 수정
//프로필 수정 접근시 줄 데이터
router.get('/edit/profile', function (req, res) {
    var user_num = req.session.user_num;
    db_raview.edit_profile(user_num, function (results) {
        res.json(results);
        console.log('edit porifle results', results);
    })
});


//save버튼 눌러 데이터 전송 시. - 회원 정보 수정
//image 저장하는거 수정바람
router.post('/edit/profile', function (req, res) {
    //var user_num = req.body.user_num;
    var user_num = req.session.user_num;
    var first = req.body.profile_first_name;
    var last = req.body.profile_last_name;
    var intro = req.body.profile_introduction;
    var url = req.body.profile_url;
    var image = req.files.profile_image_path;
    var image_url = req.body.profile_image_path;
    var  image_edit;
    console.log('image', image);

    if ( image && image.size > max_image_size) {
        res.json({
            "success": 1,
            "message": "image over size ",
            "results": {
                "profile_num": -1,
                "profile_image_path": "",
                "profile_first_name": "",
                "profile_last_name": "",
                "profile_introduction": "",
                "profile_url": ""
            }
        });
    } else {
        if(image){
            var datas = [first, last, intro, url, image, user_num];
        } else {
            var datas = [first, last, intro, url, image_url, user_num];
            image_edit = 1;
        }
        console.log('datas',datas);
        validation_string([first, last], function (val_string) {
            if (val_string) {
                db_raview.edit_profile_save(datas, image_edit, function (results) {
                    console.log('--------------');
                    console.log('results',results);
                    console.log('--------------');
                    res.json(results);
                });
            } else {
                res.json({
                    "success": 1,
                    "message": "data is invalid",
                    "results": {
                        "profile_num": -1,
                        "profile_image_path": "",
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "profile_introduction": "",
                        "profile_url": ""
                    }
                });
            }
        });
    }
});
//account settings에 접근 하였을 시 제공 데이터 - 회원의 정보
router.get('/account', function (req, res) {
    var user_num = req.session.user_num;
    db_raview.account(user_num, function (results) {
        db_raview_auth.email_auth_check(results.results.profile_email, function (auth_results) {
            results.results.email_valid = auth_results.message;
            console.log('results');
            res.json(results);
        })
    });
});

//이메일
router.post('/account/email', function (req, res) {

    var user_num = req.session.user_num;
    var edit_email = req.body.edit_email;
    var pw = req.body.profile_password;

    datas = [user_num, edit_email, pw];
    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.account_email(datas, function (results) {
                res.json(
                    results
                );
                if(results.message == "email edit success") {
                    db_raview_auth.send_email(edit_email, function (results) {
                        //메일 옵션
                        var mailOptions = {
                                    from: '<raview>',
                                    to: edit_email,
                                    subject: 'Confirm your email',
                                    text: 'raview',
                                    html: 'Welecom to raview! <br><br>'
                                    +'To start using raview, please verify your email address by clicking the link below. <br><br><table borker="1"><tr><td>'
                                        +'<a href= ' + domain + 'auth/email_auth/'+results.url+'>Verify email address</a></td></tr></table> <br><br>'
                                    +'Thanks <br>Raview Team<br>'
                                };


                        //메일을 전송함
                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) console.log(error);
                        });
                    });
                }
            });
        } else {
            res.send({
                "success": 1,
                "message": "data is invalid",
                "results": {
                    "profile_num": -1
                }
            })
        }
    })



});

//비밀번호
router.post('/account/pw', function (req, res) {

    //세션 수정 추가

    var user_num = req.session.user_num;
    var original_pw = req.body.profile_password;
    var edit_pw = req.body.edit_password;

    datas = [user_num, original_pw, edit_pw];
    validation_string(datas, function (val_string) {
        if (val_string) {
            db_raview.edit_pw(datas, function (results) {
                res.json(
                    results
                );
            });
        } else {
            res.send({
                "success": 1,
                "message": "data is invalid"
            });
        }
    })
});


//생년월일, 성별, 국가 설정
router.post('/account/save', function (req, res) {
    var user_num = req.session.user_num;
    var birth = req.body.profile_birth;
    var location = req.body.location_num;
    var gender = req.body.profile_gender;


    var datas = [ birth, gender, location, user_num];

    validation_string(datas, function (val_string) {
        if (val_string) {
            db_raview.account_edit(datas, function (results) {
                res.json(
                    results
                );
            });
        } else {
            res.send({
                "success": 1,
                "message": "data is invalid"
            });
        }
    });
});

//
////생년월일 변경
//router.post('/account/birth', function (req, res) {
//    //세션 수정 추가
//    var user_num = req.session.user_num;
//    var birth = req.body.profile_birth;
//
//    var datas = [user_num, birth];
//    validation_string(datas, function (val_string) {
//        if (val_string) {
//            db_raview.edit_birth(datas, function (results) {
//                res.json(
//                    results
//                );
//            });
//        } else {
//            res.send({
//                "success": 1,
//                "message": "data is invalid"
//            });
//        }
//    });
//});
//
////gender 수정
//router.post('/account/gender', function (req, res) {
//    //세션 수정 추가
//
//    var user_num = req.session.user_num;
//    var gender = req.body.profile_gender;
//
//    datas = [user_num, gender];
//
//    validation_string(datas, function (val_string) {
//        if (val_string) {
//            db_raview.edit_gender(datas, function (results) {
//                res.json(
//                    results
//                );
//            });
//        } else {
//            res.send({
//                "success": 1,
//                "message": "data is invalid"
//            });
//        }
//    });
//});
//
////국가 설정
//router.post('/account/location', function (req, res) {
//    //세션 수정 추가
//
//    var user_num = req.session.user_num;
//    var location = req.body.location_num;
//
//    datas = [user_num, location];
//
//    validation_string(datas, function (val_results) {
//        if (val_results) {
//            db_raview.edit_location(datas, function (results) {
//                res.json(
//                    results
//                );
//            });
//        } else {
//            res.send({
//                "success": 1,
//                "message": "data is invalid"
//            })
//        }
//    })

router.get('/search/:keyword/:page', function (req, res) {

    var user_num = req.session.user_num;
    var keywrod = req.params.keyword;
    var page = req.params.page;
    var datas = [user_num, keywrod, page];

    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.search_user(datas, function (results) {
                res.json(results);
                console.log('results',results);
            });
        } else {
            var callback_results = {};
            callback_results.success = 1;
            callback_results.message = "data is invalid";
            callback_results.results = [
                {
                    "profile_num": -1,
                    "profile_first_name": "",
                    "profile_last_name": "",
                    "profile_image_path": "",
                    "all_review_number": -1,
                    "all_recommend_num": -1,
                    "follow_status": -1
                }
            ];
            res.json(callback_results);
        }
    })
});

//
////특정 사용자를 block할 때
//router.get('/block/:user_num', function (req, res) {
//    var profile_num = req.params.user_num;
//    var user_num = req.session.user_num;
//
//    var datas=[user_num, profile_num];
//
//    validation_string(datas, function (val_results) {
//        if(val_results){
//            db_raview.block_user(datas, function (callback_results) {
//                res.json(callback_results);
//            })
//        }else {
//            var callback_results = {};
//            callback_results.success = 1;
//            callback_results.message = "data is invalid";
//            res.json(callback_results);
//        }
//    })
//})
//
////특정 사용자를 unblock할 때
//router.get('/unblock/:user_num', function (req, res) {
//    var profile_num = req.params.user_num;
//    var user_num = req.session.user_num;
//
//    var datas=[user_num, profile_num];
//
//    validation_string(datas, function (val_results) {
//        if(val_results){
//            db_raview.unblock_user(datas, function (callback_results) {
//                res.json(callback_results);
//            })
//        }else {
//            var callback_results = {};
//            callback_results.success = 1;
//            callback_results.message = "data is invalid";
//            res.json(callback_results);
//        }
//    })
//})

router.post('/recommendations', function (req, res) {

    var from = req.body.from;
    var subject = req.body.subject;
    var content = req.body.content
    var file = './public/recommendations/'+Date.now()+'.txt';
    console.log('req.body', req.body);
    console.log('file',file);

    fs.outputFile(file, "from : "+from+"\n\nsubject : "+subject+"\n\ncontent : "+content, function (err) {
        if(err){
            console.error('err',err);
            res.json({
                "success" : 1,
                "message" : "recommendations fail"
            })
        } else {
            res.json({
                "success" : 1,
                "message" : "recommendations success"
            });
        }
    });
});


//email 로그인 요청시
router.post('/login_in_page', function (req, res) {
    var email = req.body.profile_email;
    var pw = req.body.profile_password;
    var datas = [email, pw];
    console.log('login datas',datas);
        if (val_string) {
            db_raview.login_in_page(datas, function (results) {
                req.session.user_num = results.results.profile_num;    //profile_num이 있을 경우 세션에 로그인 된 이메일 저장
                console.log('results',results);
                res.json(results);
                console.log('/login2, req.session.id', req.session.id);
            });
        } else {
            var not_available_reulst = {
                "success": 1,
                "message": "data is invalid",
                "results": {"profile_num": -1}
            }
            res.json(not_available_reulst);
        }
});


module.exports = router;

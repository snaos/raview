/*
 todo

 */
var express = require('express');
var router = express.Router();
var db_raview = require('../models/db_member');

var gcm = require('node-gcm');

var api_key = "AIzaSyCULJ2IvXkLp9tzZ410qOKEGiH3_bLLgkA";
/* get users listing. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'member관련 페이지'});
});

validation_string = function (datas, callback) {
    if (datas) {
        var num = datas.length;
        var val = true;
        for (var data in datas) {
            if (datas[data]===undefined) {
                val = false;
            }
        }
        callback(val);
    } else {
        callback(false);
    }
}

//recommend
//원하는 리뷰에 추천을 한다.
router.post('/recommend', function (req, res) {
    var user_num = req.session.user_num;   //추천을 하는 유저의 email
    console.log('req.session.user_num',req.session.user_num);
    var gcm_info = "recommend";
    var review_num = req.body.review_num; //추천을 하는 글 번호.
    var datas = [user_num, review_num];

    validation_string(review_num, function (val_results) {
        if (val_results) {
            db_raview.recommend(datas, function (results) {
                var gcm_datas = [gcm_info, 0, user_num, review_num, 0];
                console.log('gcm_datas',gcm_datas);
                db_raview.gcm_send(gcm_datas, function (callback_results) {
                    var message = new gcm.Message();
                    var sender = new gcm.Sender(api_key);
                    var data_message = callback_results.message;
                    message.addData('gcm_message',data_message);
                    var registrationIds = [];
                    registrationIds.push(callback_results.token)
                    sender.sendNoRetry(message,registrationIds, function (err, gcm_result) {
                        if(err) console.error('err',err);
                        else console.log('result', gcm_result);
                    });
                    res.json(results);
                })

            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": {
                    "recommend_user": -1,     //추천을 당한 유저 추천 수
                    "recommend_review": -1     //추천을 당한 리뷰글의 추천 수
                }
            });
        }
    })
});

//unrecommend
//원하는 리뷰의 추천을 취소한다.
router.post('/unrecommend', function (req, res) {
    var user_num = req.session.user_num;   //추천을 하는 유저의 email
    var review_num = req.body.review_num; //추천을 하는 글 번호.

    var datas = [user_num, review_num];
    validation_string(review_num, function (val_results) {
        if (val_results) {
            db_raview.unrecommend(datas, function (results) {
                res.json(results);
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": {
                    "recommend_user": -1,     //추천을 당한 유저 추천 수
                    "recommend_review": -1     //추천을 당한 리뷰글의 추천 수
                }
            });
        }
    })
});

//report
//해당 리뷰에 report를 한다. 작성자와 리뷰 글의 report ++와 report테이블에 추가.
router.post('/report', function (req, res) {
    var user_num = req.session.user_num;   //신고을 하는 유저의 email
    var review_num = req.body.review_num; //신고을 당하는 글 번호.

    var datas = [user_num, review_num];
    validation_string(review_num, function (val_results) {
        if (val_results) {
            db_raview.report(datas, function (results) {
                res.json(
                    results
                );
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": {
                    "report_num": -1,     //신고을 당한 유저 신고 수
                    "report_review": -1,     //신고을 당한 리뷰글의 신고 수
                    "report_time": "",
                    "report_num": -1
                }
            });
        }
    })
});

//reply 하나 작성
//해당 리뷰에 댓글을 작성한다.
router.post('/reply', function (req, res) {
    var review_num = req.body.review_num;
    var user_num = req.session.user_num;
    var reply_content = req.body.reply_content;
    var gcm_info = "comment";

    var datas = [user_num, review_num, reply_content];

    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.reply(datas, function (results) {
                var gcm_datas = [gcm_info, 0, user_num, review_num, reply_content];
                db_raview.gcm_send(gcm_datas, function (callback_results) {
                    console.log("callback_results",callback_results);
                    var message = new gcm.Message();
                    var sender = new gcm.Sender(api_key);
                    var data_message = callback_results.message;
                    message.addData('gcm_message',data_message);
                    var registrationIds = [];
                    registrationIds.push(callback_results.token)
                    console.log('callback_results = ',callback_results);
                    sender.sendNoRetry(message,registrationIds, function (err, gcm_result) {
                        if(err) console.error('err',err);
                        else console.log('gcm_result', gcm_result);
                    });
                    res.json(
                        results
                    );
                })
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is invalid",
                "results": {
                    "review_num": -1,
                    "profile_num": -1,
                    "profile_first_name": "",
                    "profile_last_name": "",
                    "reply_num": -1,
                    "reply_time": "",
                    "reply_content": "",
                    "profile_image_path": ""
                }
            });
        }
    })
})

//reply delete
//해당 댓글을 삭제한다
router.post('/reply/delete', function (req, res) {
    var review_num = req.body.review_num;
    var user_num = req.session.user_num;
    var reply_num = req.body.reply_num;

    var datas = [user_num, review_num, reply_num];
    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.reply_delete(datas, function (results) {
                res.json(
                    results
                );
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid"
            });
        }
    });
})

//follow
//팔로우 관계 형성 버튼()
router.post('/follow', function (req, res) {
    var user_num = req.session.user_num;
    var num_get = parseInt(req.body.follow_get);
    var gcm_info = "follow";

    var datas = [user_num, parseInt(num_get,10)];

    validation_string(datas, function (val_string) {
        console.log('val_string',val_string);
        if (val_string) {
            db_raview.follow(datas, function (results) {
                var gcm_datas = [gcm_info, num_get, user_num, 0, 0];
                db_raview.gcm_send(gcm_datas, function (callback_results) {
                    var message = new gcm.Message();
                    var sender = new gcm.Sender(api_key);
                    var data_message = callback_results.message;
                    message.addData('gcm_message',data_message);
                    var registrationIds = [];
                    registrationIds.push(callback_results.token)
                    sender.sendNoRetry(message,registrationIds, function (err, gcm_result) {
                        if(err) console.error('err',err);
                        else console.log('result', gcm_result);
                    });
                    res.json(
                        results
                    );
                })
            });
        } else {
            res.json({
                "success": -1,
                "message": "data is not invalid",
                "results": {
                    "follow_status": -1
                }
            })
        }
    })

});

//un_follow
//팔로우 관계 제거 버튼()
router.post('/un_follow', function (req, res) {
    var user_num = req.session.user_num;
    var follow_get = req.body.follow_get;

    var datas = [user_num, follow_get];

    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.un_follow(datas, function (results) {
                res.json(
                    results
                );
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": {
                    "follow_status": -1
                }
            })
        }
    })
});

//profile - user information
//profile에서 보여질 해당 유저 정보들
router.get('/profile/:user_num', function (req, res) {
    var user_num = req.session.user_num;
    if (req.params.user_num == 0) {       //0을 넘겨줄 경우 나의 정보
        var profile_num = user_num;
    } else {
        var profile_num = req.params.user_num;
    }
    var datas = [user_num, profile_num];

    db_raview.profile(datas, function (results) {
        res.json(
            results
        );
    });
});

//profile - following
//나를 follow관계한 유저들을 보여준다.
router.get('/following/:profile_num/:page', function (req, res) {
    if (req.params.profile_num == 0) {       //0을 넘길 경우 나의 정보
        var user_num = req.session.user_num;
    } else {
        var user_num = req.params.profile_num;
    }
    var page = req.params.page;
    var datas = [user_num, page,req.session.user_num];
    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.following(datas, function (data) {
                res.json(data);
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": [
                    {
                        "profile_num": -1,
                        "profile_image_path": "",
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "follow_status": -1      //내가 팔로우를 했나 안했나 확인.
                    }
                ]
            });
        }
    })
});

//profile - follower
//나와의 follower관계 유저들을 보여준다.
router.get('/follower/:profile_num/:page', function (req, res) {
    if (req.params.profile_num == 0) {        //0을 넘겨줄 경우 나의 정보
        var user_num = req.session.user_num;
    } else {
        var user_num = req.params.profile_num;
    }
    var page = req.params.page;
    var datas = [user_num, page,req.session.user_num];

    validation_string(datas, function (val_results) {
        console.log('val_results',val_results);
        if (val_results) {
            db_raview.follower(datas, function (results) {
                console.log('results',results);
                res.json(results);
            })
        } else {
            res.json({
                "success": 1,
                "message": "data is invalid",
                "results": [
                    {
                        "profile_num": -1,
                        "profile_image_path": "",
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "follow_status": -1      //내가 팔로우를 했나 안했나 확인.
                    }
                ]
            });
        }
    })
});

//profile - review list
//프로필에서 보여줄 리뷰 리스트들
router.get('/profile_list/:profile_num/:page', function (req, res) {
    var user_num;
    var page = req.params.page;

    if (req.params.profile_num == 0) {        //0을 넘겨줄 경우 나의 정보
        user_num = req.session.user_num;
    } else {
        user_num = req.params.profile_num;
    }
    var datas = [user_num, page];
    validation_string(datas, function (val_results) {
        console.log('val_results',val_results);
        if (val_results) {
            db_raview.profile_review_list(datas, function (results) {
                res.json(results);
                console.log('profile_list results',results);
            })
        } else {
            res.json({
                "success": 1,
                "message": "data is invalid",
                "results": [
                    {
                        "profile_num": -1,
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "profile_image_path": "",
                        "review_image_represent_path": "",
                        "review_subject": "",
                        "review_image_num": -1,
                        "review_score": -1,
                        "review_num": -1,
                        "review_content": ""
                    }
                ]
            });
        }
    })

});

//activity
//액티비티는 누가 추천했나 누가 팔로잉했나, 누가 댓글을 달았나
//others
router.post('/activity/others', function (req, res) {
    var user_num = req.session.user_num;
    var page = req.body.page;
    //var user_num = 18;
    var datas = [user_num, page];
    console.log('datas', datas);
    validation_string(datas, function (val_results) {
        if (val_results) {
            console.log('datas', datas);
            db_raview.activity_others(datas, function (results) {
                console.log('results',results);
                res.json(
                    results
                );
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is invalid",
                "results": [
                    {
                        "info": "",
                        "mTime": "",
                        "profile_num": -1,
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "profile_image_path": "",
                        "review_num": -1,
                        "review_subject": "",
                        "review_image_represent_path": "",
                        "reply_content": ""
                    }
                ]
            });
        }
    });
});

router.post('/activity/me', function (req, res) {
    var user_num = req.session.user_num;
    var page = req.body.page;

    var datas = [user_num, page];

    validation_string(datas, function (val_results) {
        if (val_results) {
            db_raview.activity_me(datas, function (results) {
                console.log('results',results);
                res.json(
                    results
                );
            });
        } else {
            res.json({
                "success": 1,
                "message": "data is not invalid",
                "results": [
                    {
                        "info": "",
                        "mTime": "",
                        "profile_num": -1,
                        "profile_first_name": "",
                        "profile_last_name": "",
                        "review_num": -1,
                        "review_subject": "",
                        "review_image_represent_path": "",
                        "reply_content": ""
                    }
                ]
            });
        }
    })

})

router.get('/location', function (req, res) {
    db_raview.location(function (results) {
        res.json(
            results
        );
    });
});

router.get('/category', function (req, res) {
    db_raview.category(function (results) {
        res.json(
            results
        );
    });
});

router.post('/gcm_edit', function (req, res) {
    var user_num = req.session.user_num;
    var follow = req.body.follow;
    var recommend = req.body.reccommend;
    var comment = req.body.comment;

    var datas = [follow, recommend, comment, user_num];
    validation_string(datas, function (val_results) {
        if (vall_results) {
            db_raview.gcm_edit(datas, function (results) {
                res.json(results);
            });
        } else {
            var results = {};
            results.success = 1;
            results.message = "data is invaid";
            res.json(results);
        }
    })
});


//gcm notification 수정페이지 요청
router.get('/gcm_nf', function (req, res) {
    var user_num = req.session.user_num;

    datas = user_num;

    validation_string(datas, function (val_results) {
        if(val_results){
            db_raview.gcm_nf(datas, function (results) {
                res.json(results);
            });
        }else {
            res.josn({
                "success": 1,
                "message": "data is invalid"
            });
        }
    })
});

/*
 recommend일 경우
 리뷰 글 번호
 follow일 경우
 해당 유저의 번호,
 comment일 경우
 댓글 내용, 리뷰 글 번호

 */

module.exports = router;

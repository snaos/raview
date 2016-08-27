var express = require('express');
var router = express.Router();
var db_reviews = require('../models/db_reviews');
var fs = require('fs-extra');

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Review Test' });
});

router.get('/review_detail/:review_num/all_reply/:page', function(req,res){
    var compare = ["review_num","page"];
    var review_num = req.params.review_num;
    var page = req.params.page;
    review_num = parseInt(review_num, 10);
    if(page > 0){
        //console.log('num1',page);
    } else {
        //console.log('num0',page);
        page = 1;
        //console.log('page',page);
    }
    page = parseInt(page, 10);
    var datas = [page,review_num];
    var resultfail = [];

    db_reviews.read_reply(datas,function(success,results){
        console.log("results",results);
//        if( results.length == 0 ) {
//            res.json({
//                'success' : 1,
//                'message' : 'page is over',
//                'results' : resultfail
//            });
//        } else {
//        }
            if(success){
                if(results.length == 0){
                    res.json({
                        'success' : 1,
                        'message' : 'page is over',
                        'results' : resultfail
                    });
                } else {
                    res.json({
                        'success' : 1,
                        'message' : 'success',
                        'results' : results
                    });
                }
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
    });
});

router.get('/review_detail/:review_num', function(req, res) {

        var compare = ["review_num"];
        var review_num = req.params.review_num;
        var profile_num = req.session.user_num;
        profile_num = parseInt(profile_num, 10);
        review_num = parseInt(review_num, 10);
        var resultfail = {
                            review_num: -1,
                            category_num: -1,
                            review_subject: " ",
                            review_content: " ",
                            review_time: " ",
                            review_hit: -1,
                            review_score: -1,
                            review_image_num: -1,
                            review_modify_time: " ",
                            review_image_represent_path: " ",
                            review_recommend_num: -1,
                            all_recommend_num: -1,
                            review_image_path: [ ],
                            tag_name: [ ],
                            rec_status: -1,
                            rep_cnt: -1,
                            all_review_num: -1,
                            profile_num: -1,
                            profile_image_path: " ",
                            profile_first_name: " ",
                            profile_last_name: " ",
                            reply: [ ]
        };
            if(!isNaN(review_num)){
                if(!isNaN(profile_num)){
                    var datas = [review_num,profile_num];
                    console.log('datas1',datas);
                    db_reviews.read(datas, function(success,review){
                	console.log('review',review);
			console.log('success',success);
		      if(success) {
                            res.json({
                                'success' : 1,
                                'message' : 'success',
                                'results' : review
                            });
                        } else {
                            res.json({
                                'success' : 1,
                                'message' : 'data is invalid',
                                'results' : resultfail
                            });
                        }
                    });
                } else {
                    //추천 상태 확인을 위한 profile_num
                    var datas = [review_num, 0];
                    console.log('datas0',datas);
                    db_reviews.read(datas, function(success,review){
                        if(success) {
                            res.json({
                                'success' : 1,
                                'message' : 'success',
                                'results' : review
                            });
                        } else {
                            res.json({
                                'success' : 1,
                                'meesage' : 'data is invalid',
                                'results' : resultfail
                            });
                        }
                    });
                }
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
});


router.post('/write', function(req, res) {

    var files = req.files;
    var profile_num = req.session.user_num;
    //profile_num = parseInt(profile_num,10);
    profile_num = parseInt(profile_num,10);
    var review_subject = req.body.review_subject;
    var review_content = req.body.review_content;
    var category_num = req.body.category_num;
    category_num = parseInt(category_num, 10);
    var review_image_path = [];

    if(!Array.isArray(files.review_image_path)) {
        review_image_path.push(files.review_image_path.path);
    } else {
        for(var i = 0; i < files.review_image_path.length; i++){
            review_image_path.push(files.review_image_path[i].path);
        }
    }

    var review_image_represent_path = review_image_path[0];
    var review_image_num = review_image_path.length;
    var review_score = req.body.review_score;
    review_score = parseInt(review_score, 10);
    var str = req.body.review_tag;
    if(str == undefined){
        var review_tag = [];
    } else {
        var review_tag = [];
        review_tag = str.split('#');
        review_tag.shift();
    }
    var datas = '';
    var result = {};
    datas = [review_subject, review_content, category_num, review_image_represent_path, review_image_num, review_score, profile_num, review_tag];
    var data_img = review_image_path;
    var resultfail = [];

    if( review_image_represent_path != undefined && !isNaN(category_num) && !isNaN(review_image_num) && !isNaN(review_score) && review_content != undefined && review_subject != undefined && !isNaN(profile_num)) {

        db_reviews.write(datas, data_img , function(success, result){
            if(success) {
                res.json({
                    'success': 1,
                    'message' : 'success',
                    'results': result
                });
            } else {
                res.json({
                    'success': 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        });
    } else {
        //console.log('fail');
                res.json({
                    'success': 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
    }
});
router.post('/edit', function(req, res) {

    var files = req.files;
    var review_num = req.body.review_num;
    review_num = parseInt(review_num, 10);
    var review_subject = req.body.review_subject;
    var review_content = req.body.review_content;
    var category_num = req.body.category_num;
    category_num = parseInt(category_num, 10);
    var review_image_num = 0;
    var review_image_path = [];
    var review_image_url = [];
    var profile_num = req.session.user_num;
    profile_num = parseInt(profile_num, 10);
    var temp = req.body.review_image_url;
	console.log('files',files);
	console.log('req.body',req.body);
    //url을 String이 안되어 있을 경우를 대비, 만약 구분자가 있을 경우 배열로 반환
    if(temp != undefined){
        temp = ""+temp+"";
        temp = temp.split('#');
        temp.shift();
    } else {
        temp = [];
    }
	console.log('temp',temp);
    //review_image_url이 있을 경우
    if(temp.length > 0) {
        //만약 url이 하나일 경우
        if(!Array.isArray(temp)) {
            temp = [req.body.review_image_url];
            review_image_url.push(temp[0]);
            //image_url을 review_image_url에 넣는다.

            //새로운 이미지를 입력받을 경우
            if(JSON.stringify(files) == '{}'){
                files = [];
            } else {
                if(Object.keys(files).length != 0){
                    //파일이 하나라도 들어올 경우
                    if(files.review_image_path != undefined){
                        //파일이 하나일 경우 배열, 아니면 객체로 들어오는 것을 기준으로 구분
                        if(!Array.isArray(files.review_image_path)) {
                            review_image_path.push(files.review_image_path.path);
                        } else {
                            for(var i = 0; i < files.review_image_path.length; i++){
                                review_image_path.push(files.review_image_path[i].path);
                            }
                        }
                        //새로운 이미지 갯수와 기존 이미지의 갯수를 +
                        review_image_num = temp.length + review_image_path.length;
                    } else {
                        //기존 이미지만 있을 경우
                        review_image_num = 1;
                    }
                }
            }
            var review_image_represent_path = temp[0];
            //url이 두 개 이상 들어올 경우
        } else {

            //두 개 이상의 이미지들이 있기 때문에 반복문을 통해 처리
            for(var i = 0; i < temp.length; i++){
                review_image_url.push(temp[i]);
            }

            //새로운 이미지가 들어올 경우
            if(JSON.stringify(files) == '{}'){
                files = [];
            } else {
                if(Object.keys(files).length != 0){
                    if(!Array.isArray(files.review_image_path)) {
                        review_image_path.push(files.review_image_path.path);
                    } else {
                        for(var i = 0; i < files.review_image_path.length; i++){
                            review_image_path.push(files.review_image_path[i].path);
                        }
                    }

                    //새로운 이미지의 갯수 + 이미 존재하는 이미지의 경로 갯수 +
                    review_image_num = review_image_path.length + temp.length;
                } else {

                    //만약 파일이 존재하지 않는 경우 기존 이미지의 갯수 +

                    review_image_num = temp.length;
                }
            }
        }
        var review_image_represent_path = temp[0];
        //기본적으로 이미 존재하는 이미지를 첫 번째 사진으로 지정
    } else {
        //새로운 이미지들이 들어올 경우, 기존 이미지는 존재하지 않음
            if(!Array.isArray(files.review_image_path)) {
                review_image_path.push(files.review_image_path.path);
                review_image_represent_path = review_image_path[0];
                review_image_num = 1;
            } else {
                for(var i = 0; i < files.review_image_path.length; i++){
                    review_image_path.push(files.review_image_path[i].path);
                }
                review_image_represent_path = review_image_path[0];
                review_image_num = review_image_path.length;
            }
            //기존 url이 없기 때문에 새로운 이미지들로 지정됨
    }

    var review_score = req.body.review_score;
    review_score = parseInt(review_score, 10);

    var str = req.body.review_tag;

    if(str == undefined) {
        //태그가 입력되지 않을 때
        var review_tag = [];
    } else {
        var review_tag = [];
        //태그가 입력될 때
        review_tag = str.split('#');
        review_tag.shift();
    }
    var datas = '';
    datas = [review_subject, review_content, category_num, review_image_represent_path, review_image_num, review_score, profile_num,  review_num, review_tag];

    var data_img = review_image_path;
    var resultfail = [];

    console.log('datas',datas);

    if(!isNaN(review_num) && review_image_represent_path != undefined && !isNaN(category_num) && !isNaN(review_image_num) && !isNaN(review_score) && review_content != undefined && review_subject != undefined && !isNaN(profile_num)) {
            console.log('suc');
        //url과 새로 입력된 이미지는 매개변수를 다르게 준다.
            db_reviews.edit(datas, data_img, review_image_url, function(success,result) {
                console.log('results',result);
                if(success){
                    res.json({
                        'success' : 1,
                        'message' : 'success',
                        'results' : {
                            "review_num" : result
                        }
                    });
                } else {
                    console.log('fail1');
                    res.json({
                        'success' : 1,
                        'message' : 'data is invalid',
                        'results' : resultfail
                    });
                }
            });
        } else {
                console.log('fail2');
                    res.json({
                        'success' : 1,
                        'message' : 'data is invalid',
                        'results' : resultfail
                    });
        }
});



router.post('/delete', function(req, res) {
    var compare = ["review_num"];
    var review_num = req.body.review_num;
    review_num = parseInt(review_num, 10);
    var data = review_num;
    var profile_num = req.session.user_num;
    profile_num = parseInt(profile_num,10);
        //req.session.user_num;
    if(!isNaN(data) && !isNaN(profile_num)){
        db_reviews.delete(data, function(success){
            if(success){
                    res.json({
                        "success" : 1,
                        "message" : 'success'
                    });
            } else {
                    res.json({
                        "success" : 1,
                        "message" : "data is invalid"
                    });
            }
        });
    } else {
        res.json({
            "success" : 1,
            "message" : "data is invalid"
        });
    }
});

module.exports = router;

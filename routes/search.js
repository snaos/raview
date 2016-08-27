var express = require('express');
var router = express.Router();
var db_search = require('../models/db_search');

/* get users listing. */

router.get('/myfeed/:page', function(req, res) {

    //profile_num은 세션을 통해 입력받음.
    //var compare = ["page"];
    console.log('in myfeed, req.session.id',req.session.id);
    var profile = req.session.user_num;
    profile = parseInt(profile,10);
    var page = req.params.page;
    page = parseInt(page,10);
    var datas = [profile,page];
    var resultfail = [];
    db_search.myfeed(datas,function(success,results){
        //console.log('length',results.length);
        if( results.length == 0 ) {
            res.json({
                'success' : 1,
                'message' : 'page is over',
                'results' : resultfail
            });
        } else {
            if(success){
                res.json({
                    'success' : 1,
                    'message' : 'success',
                    'results' : results
                });
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        }
    });
});

router.get('/tag/:tag/:page', function(req, res) {

    var tag = req.params.tag;
    var page = req.params.page;
    page = parseInt(page,10);

    var datas = [tag,page];
    var resultfail = [];
    db_search.tag(datas,function(success,results){
        //console.log('length',results.length);
        if( results.length == 0 ) {
            res.json({
                'success' : 1,
                'message' : 'page is over',
                'results' : resultfail
            });
        } else {
            if(success) {
                res.json({
                    'success' : 1,
                    'message' : 'success',
                    'results' : results
                });
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        }
    });
});

router.get('/category/:category_num/:page', function(req, res) {

    var cn = req.params.category_num;
    cn = parseInt(cn,10);

    var page = req.params.page;
    page = parseInt(page,10);

    var datas = [cn,page];
    var resultfail = [];
    db_search.category(datas,function(success,results){

       // console.log('length',results.length);
        if( results.length == 0 ) {
            res.json({
                'success' : 1,
                'message' : 'page is over',
                'results' : resultfail
            });
        } else {
            if(success){
                res.json({
                    'success' : 1,
                    'message' : 'success',
                    'results' : results
                });
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        }
    });
});

router.get('/subject/:subject/:page', function(req, res) {

    var page = req.params.page;
    page = parseInt(page,10);
    var sub = req.params.subject;
    var datas = [sub,page];
    var total = '';
    var resultfail = [];
    //var compare = ["subject","page"];


    db_search.subject(datas,function(success,results){
        console.log('results',results);
        console.log('suuccess',success);

            if(success){
                if(results.length == 1) {
                    total = results.pop();
                    if(total[0].avg == null || total[0].hit == null){
                        var reviews = {  'review_subject' : sub,
                                         'review_score_avg' : 0,
                                         'review_rev_total' : 0,
                                         'reviews' : resultfail } ;
                        res.json({
                            'success' : 1,
                            'message' : 'result is empty',
                            'results' :  reviews
                        });
                        //console.log('result is empty',reviews);
                    } else {
                        var reviews = {  'review_subject' : sub,
                                         'review_score_avg' : total[0].avg,
                                         'review_rev_total' : total[0].hit,
                                         'reviews' : resultfail } ;
                        res.json({
                            'success' : 1,
                            'message' : 'page is over',
                            'results' :  reviews
                        });
                        //console.log('page is over', reviews);
                    }
                } else {
                    total = results.pop();
                    //console.log('total',total);
                    var reviews = {  'review_subject' : sub,
                                     'review_score_avg' : total[0].avg,
                                     'review_rev_total' : total[0].hit,
                                     'reviews' : results } ;
                    res.json({
                        'success' : 1,
                        'message' : 'success',
                        'results' :  reviews
                    });
                    //console.log('success', reviews);
                }
            } else {

    var reviews = {  'review_subject' : sub,
                'review_score_avg' : 0,
                'review_rev_total' : 0,
                'reviews' : resultfail };

                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : reviews
                });

                //console.log('data is invalid');
            }
    });
});

router.get('/popular/reviews/:page', function(req,res){
    var datas = req.params.page;
    datas = parseInt(datas,10);
    var resultfail = [];
    db_search.p_review(datas,function(success,results){

        //console.log('length',results.length);
        if( results.length == 0 ) {
            res.json({
                'success' : 1,
                'message' : 'page is over',
                'results' : resultfail
            });
        } else {
            if(success){
                res.json({
                    'success' : 1,
                    'message' : 'success',
                    'results' : results
                });
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        }
    });
});

router.get('/popular/reviewers/:page', function(req, res){

    var profile_num = req.session.user_num;
    profile_num = parseInt(profile_num,10);
    var page = req.params.page;
    page = parseInt(page,10);

    var datas = [profile_num,page];

    var resultfail = [];

    db_search.p_reviewer(datas,function(success,results){
        console.log('popular reviewer results = ',results);
        //console.log('length',results.length);
        if( results.length == 0 ) {
            res.json({
                'success' : 1,
                'message' : 'page is over',
                'results' : resultfail
            });
        } else {
            if(success){
                res.json({
                    'success' : 1,
                    'message' : 'success',
                    'results' : results
                });
            } else {
                res.json({
                    'success' : 1,
                    'message' : 'data is invalid',
                    'results' : resultfail
                });
            }
        }
    });
});


module.exports = router;

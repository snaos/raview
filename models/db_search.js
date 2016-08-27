//model

var mysql = require('mysql');
var async = require('async');
var _ = require('lodash');

var pool = mysql.createPool({
	connectionLimit: 150,
	host: '127.0.0.1',
	user: 'root',
	password: 'raviewme5',
	database: 'raview'
});

function CompareForSort(first, second)
{
    if (first == second)
        return 0;
    if (first < second)
        return -1;
    else
        return 1;
}

exports.myfeed = function(datas,callback_m) {
    //console.log('datas',datas);
    pool.getConnection(function(err,conn){
        if(err) console.error('err',err);
        var success = false;
        var size = 10;
        var begin = (datas[1] -1)* 10;
        var end = begin + (size-1);
        var sqlm = 'SELECT profile_num_get FROM follow WHERE profile_num_do = ?';
        var sql = 'SELECT review_num FROM review re WHERE profile_num = ? and review_delete = "N" ORDER BY review_time DESC';
        var sqlre = 'select * from review where review_num = ?';
        var sqlp = 'select * from profile where profile_num = ?';
        var results = '';
        var final = [];
        var final2 = [];
        var final3 = [];
        var callback_datas = [];
        var callback_end = [];
        conn.query(sqlm, [datas[0]], function(err,rows){
            if(err) console.error('err',err);
                results = rows;
                //console.log('results',results);
            results = rows;
            async.waterfall([
                function(callback){
                    async.each(results, function(re,callbackE){
                        conn.query(sql,[re.profile_num_get],function(err,row){
                            final = final.concat(row);
                            callbackE();
                        });
                    },function(err){
                        if(err) console.error('err',err);
                        //console.log('final',final);
                        for(var i = 0; i < final.length; i++){
                            final2.push(final[i].review_num);
                        }
                        callback();
                    });
                },
                function(callback){
                    final2.sort(CompareForSort);
                    final2.reverse();
                    callback();
                },
                function(callback){
                    async.each(final2, function(re,callbackE){
                        conn.query(sqlre,[re],function(err,row){
                            if(err) console.error('err',err);
                            final3.push(row[0]);
                            callbackE();
                        });
                    },function(err){
                        if(err) console.error('err',err);
                        callback();
                    });
                },
                function(callback){
                    async.each(final3, function(re,callbackE){
                        conn.query(sqlp,re.profile_num,function(err,row){
                            re.profile_num = row[0];
                            callbackE();
                        });
                    },function(err){
                        if(err) console.error('err',err);
                        for(var i =0; i<final.length;i++){
                            callback_datas[i] = {};
                            callback_datas[i].profile_num = final3[i].profile_num.profile_num;
                            callback_datas[i].profile_first_name = final3[i].profile_num.profile_first_name;
                            callback_datas[i].profile_last_name = final3[i].profile_num.profile_last_name;
                            callback_datas[i].profile_image_path = final3[i].profile_num.profile_image_path;
                            callback_datas[i].review_subject = final3[i].review_subject;
                            callback_datas[i].review_content = final3[i].review_content;
                            callback_datas[i].review_image_num = final3[i].review_image_num;
                            callback_datas[i].review_image_represent_path = final3[i].review_image_represent_path;
                            callback_datas[i].review_score = final3[i].review_score;
                            callback_datas[i].review_num = final3[i].review_num;
                        }
                        callback();
                    });

                },
                function(callback){
                    callback_end = callback_datas.slice(begin,end);
                    callback();
                },
            ],function(err){
                if(err) console.error('err',err);
                        success = true;
                        callback_m(success,callback_end);
                        conn.release();
            });
        });
    });
};

exports.p_review = function(datas,callback_pr){
    //console.log('datas',datas);
    pool.getConnection(function(err,conn){
        if(err) console.error('err',err);
        var success = false;
        var begin = (datas -1)* 10;
        var results = '';
        var sql = 'SELECT rv2.*, rv2.review_hit, count(rcm.review_num) as rcm_cnt, -(to_days(now())- to_days(review_time)) as sub_rev, review_cnt+count(rcm.review_num)+review_hit-(to_days(now())- to_days(review_time)) as score_final from (SELECT rv.*, count(rp.review_num) as review_cnt FROM review rv left outer join reply rp on rv.review_num = rp.review_num GROUP BY rv.review_num) rv2 left outer join recommend rcm on rv2.review_num = rcm.review_num where rv2.review_delete = "N" group by rv2.review_num order by review_cnt+count(rcm.review_num)+review_hit-(to_days(now())- to_days(review_time)) desc limit ?, 10';

        var sqlp = 'select * from profile where profile_num = ?';

        conn.query(sql,begin,function(err,rows) {
            if(err) console.error('err',err);
            results = rows;
            async.each(results,function(re,callback){
                conn.query(sqlp,re.profile_num,function(err,pro){
                    if(err) console.error('err',err);
                    re.profile_num = pro;
                    callback();
                });
            }, function(err){
                if(err) console.error('err',err);
                var callback_datas = [];
                for(var i =0; i<results.length;i++){
                    callback_datas[i] = {};
                    callback_datas[i].profile_num = results[i].profile_num[0].profile_num;
                    callback_datas[i].profile_first_name = results[i].profile_num[0].profile_first_name;
                    callback_datas[i].profile_last_name = results[i].profile_num[0].profile_last_name;
                    callback_datas[i].profile_image_path = results[i].profile_num[0].profile_image_path;
                    callback_datas[i].review_subject = results[i].review_subject;
                    callback_datas[i].review_content = results[i].review_content;
                    callback_datas[i].review_image_num = results[i].review_image_num;
                    callback_datas[i].review_image_represent_path = results[i].review_image_represent_path;
                    callback_datas[i].review_score = results[i].review_score;
                    callback_datas[i].review_num = results[i].review_num;
                }
                success = true;
                console.log("callback_datas",callback_datas);
                callback_pr(success,callback_datas);
                conn.release();
            });
        });
    });
};


exports.p_reviewer = function(datas, callback_pore){
    pool.getConnection(function(err,conn){
        var success = false;
        var results = '';
        var begin = (datas[1] -1)* 10;
        var sql = 'select if(rpro.profile_num = fpro.profile_num_get, 1, 0) status, (select count(*) from review where profile_num = rpro.profile_num and review_delete ="N" group by rpro.profile_num) rev_cnt, rpro.*, fpro.profile_num_get from rpro left outer join (select *, if(f.profile_num_do = ?, 1, 0) as follow_status from follow f where f.profile_num_do = ?) fpro on rpro.profile_num = fpro.profile_num_get order by rpro.rcm_all+rev_cnt desc limit ?, 10';
        var sqlr = 'select review_image_represent_path, review_subject, review_num from review where profile_num = ? and review_delete = "N" order by review_time desc limit 0,3';
        var callback_datas = [];
        conn.query(sql,[datas[0],datas[0],begin],function(err,rows){
            if(err) console.error('err',err);
            results = rows;

            async.waterfall([
                function(callback){
                    async.each(results,function(item,callbacka){
                        conn.query(sqlr,item.profile_num,function(err,row){
                            item.profile_num_get = row;
                            callbacka();
                        });
                    }, function(err){
                        if(err) console.error('err',err);
                        callback(null,results);
                    });
                },
            ],function(err,results){
                if(err) console.error('err',err);
                success = true;
                for(var i = 0; i<results.length; i++){
                    callback_datas[i] = {};
                    callback_datas[i].profile_num = results[i].profile_num;
                    callback_datas[i].all_recommend_num = results[i].rcm_all;
                    callback_datas[i].all_review_num = results[i].rev_cnt;
                    callback_datas[i].follow_status = results[i].status;
                    callback_datas[i].profile_image_path = results[i].profile_image_path;
                    callback_datas[i].profile_last_name= results[i].profile_last_name;
                    callback_datas[i].profile_first_name = results[i].profile_first_name;
                    callback_datas[i].reviews = results[i].profile_num_get;
                }
                var reviewers = [];
                var cnt= 0;

                async.each(callback_datas, function (callback_data, callback) {
                    conn.query('SELECT profile_image_path,profile_last_name, profile_first_name FROM profile WHERE profile_num=?', callback_data.profile_num, function (err, row) {
                        reviewers[cnt] = callback_data;
                        reviewers[cnt].profile_image_path = row[0].profile_image_path;
                        reviewers[cnt].profile_first_name = row[0].profile_first_name;
                        reviewers[cnt].profile_last_name = row[0].profile_last_name;
                        cnt++;
                        callback();
                    });
                }, function (err) {
                    if(err) console.error('err',err);
                    callback_pore(success,reviewers);
                    conn.release();
                })

            });
        });
    });
};

exports.category = function(datas, callback_g){
    //console.log('datas',datas);
    var begin = (datas[1] -1) * 10;
    //console.log('datas',datas[1]);
    var results = '';
    var success = false;
    //console.log('begin',begin);
    pool.getConnection(function(err,conn){
        if(err) console.error('err',err);
        var sql = 'select * from review_final where category_num = ? and review_delete = "N" order by score_final desc limit ?,10';
        var sqlp = 'select * from profile where profile_num = ?';
        conn.query(sql,[datas[0],begin],function(err,rows){
            if(err) console.error('err',err);
            results = rows;
            async.each(results, function(re,callback){
                conn.query(sqlp,re.profile_num, function(err,pro){
                    re.profile_num = pro;
                    callback();
                });
            }, function(err){
                    if(err) console.error('err',err);
                        var callback_datas = [];
                        for(var i =0; i<results.length;i++){
                            callback_datas[i] = {};
                            callback_datas[i].profile_num = results[i].profile_num[0].profile_num;
                            callback_datas[i].profile_first_name = results[i].profile_num[0].profile_first_name;
                            callback_datas[i].profile_last_name = results[i].profile_num[0].profile_last_name;
                            callback_datas[i].profile_image_path = results[i].profile_num[0].profile_image_path;
                            callback_datas[i].review_subject = results[i].review_subject;
                            callback_datas[i].review_content = results[i].review_content;
                            callback_datas[i].review_image_num = results[i].review_image_num;
                            callback_datas[i].review_image_represent_path = results[i].review_image_represent_path;
                            callback_datas[i].review_score = results[i].review_score;
                            callback_datas[i].review_num = results[i].review_num;
                        }
                        //console.log('callback',callback_datas);
                        success = true;
                        callback_g(success,callback_datas);
                        conn.release();
            });
        });
    });
};

exports.subject = function(datas, callback_s){
    //console.log('datas',datas);
    var begin = (datas[1] -1) * 10;
    var results = '';
    pool.getConnection(function(err,conn){
        if(err) console.error('err',err);
        var success = false;
        var sql = 'select * from review_final where review_subject = ? and review_delete = "N" order by score_final desc limit ?,10';
        var sqlt = 'select round(avg(review_score)) avg, count(review_num) hit from review where review_subject = ? AND review_delete="N"';
        var sqlp = 'select * from profile where profile_num = ?';

        conn.query(sql,[datas[0],begin],function(err,rows){
            if(err) console.error('err',err);
            conn.query(sqlt,[datas[0]],function(err,items){
                if(err) console.error('err',err);
                results = rows;
                    async.each(results,function(re,callback){
                        conn.query(sqlp,re.profile_num,function(err,pro){
                            re.profile_num  = pro;
                            callback();
                        });
                    }, function(err){
                        if(err) console.error('err',err);
                        //console.log('results',results);
                        var callback_datas = [];
                        for(var i =0; i<results.length;i++){
                            callback_datas[i] = {};
                            callback_datas[i].profile_num = results[i].profile_num[0].profile_num;
                            callback_datas[i].profile_first_name = results[i].profile_num[0].profile_first_name;
                            callback_datas[i].profile_last_name = results[i].profile_num[0].profile_last_name;
                            callback_datas[i].profile_image_path = results[i].profile_num[0].profile_image_path;
                            callback_datas[i].review_subject = results[i].review_subject;
                            callback_datas[i].review_content = results[i].review_content;
                            callback_datas[i].review_image_num = results[i].review_image_num;
                            callback_datas[i].review_image_represent_path = results[i].review_image_represent_path;
                            callback_datas[i].review_num = results[i].review_num;
                            callback_datas[i].review_score = results[i].review_score;
                        }
                        callback_datas.push(items);
                        //console.log('callback',callback_datas);
                        success = true;
                        callback_s(success,callback_datas);
                        conn.release();
                    });
            });
        });
    });
};


exports.tag = function(datas, callback_t){
    var begin = (datas[1] -1) * 10;
    var results = '';
    pool.getConnection(function(err,conn){
        if(err) console.error('err',err);
        var success = false;

        var sqlp = 'select * from profile where profile_num = ?';

        var sqlt = 'select rf.profile_num, rf.review_image_represent_path, rf.review_image_num, rf.review_num, rf.review_subject,rf.review_content, date_format(rf.review_time, "%Y-%c-%d %H:%i:%s")  ,rts.tag_name, (rf.rcm_cnt +rf.review_cnt +rf.sub_rev +rf.review_hit) score_final from review_final rf left outer join review_tag_sum rts on rf.review_num = rts.review_num where rts.tag_name = ? and rf.review_delete = "N" order by score_final desc';


        conn.query(sqlt,[datas[0],begin],function(err,rows){
            if(err) console.error('err',err);
            results = rows;
                async.each(results, function(re,callback){
                    conn.query(sqlp,re.profile_num,function(err,pro){
                        re.profile_num = pro;
                        callback();
                    });
                }, function(err){
                if(err) console.error('err',err);
                //console.log('results',results);
                var callback_datas = [];
                for(var i =0; i<results.length;i++){
                    callback_datas[i] = {};
                    callback_datas[i].profile_num = results[i].profile_num[0].profile_num;
                    callback_datas[i].profile_first_name = results[i].profile_num[0].profile_first_name;
                    callback_datas[i].profile_last_name = results[i].profile_num[0].profile_last_name;
                    callback_datas[i].profile_image_path = results[i].profile_num[0].profile_image_path;
                    callback_datas[i].review_subject = results[i].review_subject;
                    callback_datas[i].review_content = results[i].review_content;
                    callback_datas[i].review_image_num = results[i].review_image_num;
                    callback_datas[i].review_image_represent_path = results[i].review_image_represent_path;
                    callback_datas[i].review_score = results[i].review_score;
                    callback_datas[i].review_num = results[i].review_num;
                }
                //console.log('callback',callback_datas);
                success = true;
                callback_t(success,callback_datas);
                conn.release();
                });
        });
    });
};

//model
var multer = require('multer');
var mysql = require('mysql');
var fs = require('fs');
var async = require('async');
var fse = require('fs-extra');
var _ = require('lodash');
var pool = mysql.createPool({
	connectionLimit: 150,
	host: '127.0.0.1',
	user: 'root',
	password: 'raviewme5',
	database: 'raview'
});

var ip = 'http://54.65.222.144';
//date_format(now(),"%Y-%c-%d %H:%i:%s")
exports.read_reply = function(datas, callback_rp){
    pool.getConnection(function(err,conn){
        var success = false;
        var results = '';
        var begin = (datas[0] -1) * 10;
        var sql = 'SELECT pf.profile_num, profile_first_name, profile_last_name, profile_image_path, reply_num, date_format(reply_time, "%Y-%c-%d %H:%i:%s") reply_time, reply_content FROM reply rp JOIN profile pf ON rp.profile_num = pf.profile_num WHERE review_num = ? ORDER BY reply_time asc limit ?,20';
        var sqlr = 'select * from review where review_num = ? and review_delete = "N"';

            conn.query(sql,[datas[1],begin],function(err, rows){
                if(err) console.error('err',err);
                success = false;
                conn.query(sqlr,datas[1],function(err,row){
                    //console.log('row_review',row);
                    if(row.length > 0){
                        success = true;
                        conn.release();
                        callback_rp(success,rows);
                    } else {
                        success = false;
                        conn.release();
                        callback_rp(success,rows);
                    }
                });
        });
    });
}

exports.read = function(datas, callback_r) {
    var num = datas;
    pool.getConnection(function(err, conn){
        var success = false;
        var hit = 'UPDATE review SET review_hit = review_hit+1 WHERE review_num = ?';

        var sql = 'SELECT review_num,category_num,review_subject,review_content,date_format(review_time,"%Y-%c-%d %H:%i:%s") review_time,review_hit,review_score,review_image_num,date_format(review_modify_time,"%Y-%c-%d %H:%i:%s") review_modify_time, review_image_represent_path FROM review WHERE review_num = ? AND review_delete = "N"';

        //review 정보
        var a_rc_r = 'SELECT count(review_num) as review_recommend_num FROM recommend WHERE review_num = ?';
        //review 추천 총 횟수
        var a_rc_p = 'select count(*) as all_recommend_num from recommend rcm join review re on re.review_num = rcm.review_num WHERE re.profile_num = (SELECT profile_num FROM review WHERE review_num = ?)';
        //reviewer 추천 총 횟수
        var a_re_c = 'select count(review_num) as all_review_num from review WHERE profile_num = (select profile_num from review WHERE review_num = ?)';

        var r_pro = 'SELECT profile_num,profile_image_path,profile_first_name,profile_last_name FROM profile WHERE profile_num = (SELECT profile_num FROM review WHERE review_num = ?)';

        var rpy_pn = 'SELECT profile_num FROM reply WHERE review_num = ?';
        var rpy_p_rinf = 'SELECT reply_num,reply_content,profile_num FROM reply WHERE review_num = ? order by reply_time desc limit 0,5';
        //배열 돌려야 함.
        var ri = 'SELECT image_path FROM review_image WHERE review_num = ?';
        var reply_profile = 'select profile_num,profile_first_name,profile_last_name,profile_image_path from profile where profile_num = ?';

        var rcm_ck = 'select count(*) rec_status from recommend where review_num = ? and profile_num = ?';
        var rev_rep = 'select review_cnt rep_cnt from review_rpl where review_num = ?';

        var tag = 'select tag_name from review_tag rt join tag t on t.tag_num = rt.tag_num where review_num = ? order by review_num';
        var sqlck = 'select * from review where review_num = ? and review_delete = "N" ';
        conn.query(sqlck,datas[0],function(err,row){

        if(row.length > 0){

        conn.query(hit,datas[0],function(err, row){
            if(err) console.error('err',err);
            success = false;
            conn.query(sql,datas[0],function(err, row){
                if(err) console.error('err',err);
                var review = row[0];
                conn.query(a_rc_r,datas[0],function(err, row){
                    if(err) console.error('err',err);
                    review = _.merge(review,row[0]);
                    conn.query(a_rc_p,datas[0],function(err,row){
                        if(err) console.error('err',err);
                        review = _.merge(review,row[0]);
                        conn.query(ri,datas[0], function(err,row){
                            var image = {review_image_path : []};
                            //console.log('row',row);
                            for(var i =0; i <row.length; i++){
                                image.review_image_path.push(row[i].image_path);
                            }
                            review = _.merge(review,image);
                        });

                        conn.query(tag,datas[0],function(err,row){
                            if(err) console.error('err',err);
                            var j = [];
                            var tag_name = {};
                            if(row.length != 0){
                                for(var i = 0; i < row.length; i++){
                                    j.push(row[i].tag_name);
                                    tag_name.tag_name = j;
                                    review = _.merge(review,tag_name);
                                }
                            } else {
                                tag_name = {tag_name : []};
                                review = _.merge(review,tag_name);
                            }
                        });

                        conn.query(rev_rep, [datas[0]], function(err,row){
                            var rep = {rep_cnt : row[0].rep_cnt};
                            review = _.merge(review,rep);
                        });

                        conn.query(rcm_ck,[datas[0],datas[1]],function(err,row){
                            if(err) console.error('err',err);
                            if(row.length != 0){
                                 var rec = {rec_status : row[0].rec_status};
                                 review = _.merge(review,rec);
                            } else {
                                var rec = {rec_status : 0};
                                review = _.merge(review,rec);
                            }
                        });

                        //console.log('review',review);
                        conn.query(a_re_c,[datas[0]],function(err,row){
                            if(err) console.error('err',err);
                            review = _.merge(review,row[0]);
                            conn.query(r_pro,datas[0],function(err,row){
                                if(err) console.error('err',err);
                                if(row.length == 0){
                                    //console.log('fail!');
                                    var success = false;
                                    callback_r(success);
                                    conn.release();
                                } else {
                                var pn = row[0].profile_num;
                                //console.log('pn',pn);
                                review = _.merge(review,row[0]);
                                //console.log('review',review);
                                    conn.query(rpy_p_rinf,[datas[0]],function(err,row){
                                        if(err) console.error('err',err);
                                            //console.log('row',row);
                                    var row_array = [];
                                    var i = 0;
                                    var temp = [];
                                    async.each(row,function(item,callback){

                                        conn.query(reply_profile,item.profile_num,function(err,rowPro){
                                            //console.log('rowPro',rowPro);
                                            row_array.push(rowPro);
                                                                                    //console.log('row[i]',row[i]);
                                            temp[i] = {};
                                            temp[i].reply_num = row[i].reply_num;
                                            temp[i].reply_content = row[i].reply_content;
                                            temp[i].profile_num = row[i].profile_num;
                                            temp[i].profile_last_name = rowPro[0].profile_last_name;
                                            temp[i].profile_first_name = rowPro[0].profile_first_name;
                                            temp[i].profile_image_path = rowPro[0].profile_image_path;
                                            i++;
                                            callback();
                                        });
                                    }, function(err){
                                        //console.log('datas',datas);
                                            var reply = {reply: temp };
                                            review = _.merge(review,reply);
                                            conn.release();
                                            success = true;
                                            callback_r(success,review);;
                                    });
                                });
                                }//if row.length = 0
                            });
                        });
                    });
                });
            });
        });
    } else {
                        conn.release();
                        success = false;
                        callback_r(success);
    }
        });
    });
}

exports.edit = function(datas, datas_img, review_image_url, callback_e) {
    //console.log('datas_img',datas_img);
    //console.log('review_image_url-----------',review_image_url);

	pool.getConnection(function(err, conn) {
		if(err) console.error('err',err);
        var data_img = datas_img;
        var data_tag = datas.pop();
        var data = datas;
        var success = false;
        var sql_rtd = 'DELETE FROM review_tag WHERE review_num = ?';
        var sql_st = 'SELECT tag_name FROM tag WHERE tag_name = ?';
        var sql_t = 'INSERT INTO tag(tag_name) VALUES (?)';
        var sql_rt = 'INSERT INTO review_tag (review_num, tag_num) VALUES (?,(SELECT tag_num FROM tag WHERE tag_name = ?))';

        var sql_rid = 'DELETE FROM review_image WHERE review_num = ?';

        var sql = 'UPDATE review SET review_subject = ?, review_content = ?, category_num = ?, review_image_represent_path = ?, review_image_num = ?, review_modify_time = now(), review_score = ? WHERE profile_num = ? AND review_num = ?';

        var sql_rii = 'INSERT INTO review_image (review_num, image_path, image_name) VALUES (?,?,?)';
        var sql_ii = 'SELECT image_path from review_image where review_num = ?';
        var sqliu = 'update review set review_image_represent_path = ? where review_num = ?';

        var sql1 = 'select image_path from review_image where review_num = ? and image_path not in (?)';
        var sql2 = 'select image_path from review_image where review_num = ? and image_path not in (?,?)';
        var sql3 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?)';
        var sql4 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?)';
        var sql5 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?)';
        var sql6 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?,?)';
        var sql7 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?,?,?)';
        var sql8 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?,?,?,?)';
        var sql9 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?,?,?,?,?)';
        var sql10 = 'select image_path from review_image where review_num = ? and image_path not in (?,?,?,?,?,?,?,?,?,?)';


        async.series([
            function(callback){
                conn.query(sql_rtd,data[7],function(err, row){
                    if(err) console.error('err',err);
                    //console.log('review_tag 삭제 성공');
                    //console.log('row num',row);
                    callback();
                });
                //console.log('callback1',1);
            },
            function(callback){
                //console.log('data_img',data_img);
                        async.forEach(data_img,function(row,callbackb){
                           //console.log('image_name',row.substring(14));
                                fse.move(row,'public/uploads/review'+row.substring(14),function(err) {
                                    if (err) return console.error(err)
                                    //console.log('datas_img_row',row);
                                    //console.log('datas_img_name',row.substring(14));
                                });
                            callbackb();
                        }, function(err){
                            if(err) console.log('err',err);
                            //console.log("success!")
                            callback();
                        });
            },
            function(callback){
                async.forEach(data_tag, function(item){
                    conn.query(sql_st, item, function(err, rowst){
                        if(err) console.error('err',err);
                            if(rowst.length == 0){
                                conn.query(sql_t, item, function(err, row1){
                                    if(err) console.error('err',err);
                                });
                            }
                        conn.query(sql_rt, [data[7],item], function(err, rowst){
                            if(err) console.error('err',err);
                        });
                    });
                });
                callback();
            },
            function(callback){
                conn.query(sql,data,function(err,row){
                    if(err) console.error('err',err);
                });
                //console.log('length--------',review_image_url.length);
                    if(review_image_url.length > 0) {

                        switch (review_image_url.length) {
                            case 1:
                                conn.query(sql1,[data[7],review_image_url[0]],function(err,row){
                                    if(err) console.error('err',err);
                                    //console.log('review_image_url_delete',row);
                                    //console.log('review_image_url_delete',this.sql);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 2:
                                //console.log('length------2-------');
                                conn.query(sql2,[data[7],review_image_url[0],review_image_url[1]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 3:
                                conn.query(sql3,[data[7],review_image_url[0],review_image_url[1],review_image_url[2]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 4:
                                conn.query(sql4,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 5:
                                conn.query(sql5,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 6:
                                conn.query(sql6,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4],review_image_url[5]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 7:
                                conn.query(sql7,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4],review_image_url[5],review_image_url[6]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 8:
                                conn.query(sql10,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4],review_image_url[5],review_image_url[6],review_image_url[7]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 9:
                                conn.query(sql10,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4],review_image_url[5],review_image_url[6],review_image_url[7],review_image_url[8]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                            case 10:
                                conn.query(sql10,[data[7],review_image_url[0],review_image_url[1],review_image_url[2],review_image_url[3],review_image_url[4],review_image_url[5],review_image_url[6],review_image_url[7],review_image_url[8],review_image_url[9]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;

                            default:
                                conn.query(sql_ii,[data[7]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                });
                                                    callback();
                                    break;
                        }} else {
                                conn.query(sql_ii,[data[7]],function(err,row){
                                    if(err) console.error('err',err);
                                        for( var i = 0; i < row.length; i++ ){
                                            fse.remove(row[i].image_path, function(err){
                                                if(err) console.error('err',err);
                                            });
                                        }
                                                    callback();
                                });
                        }
            },
            function(callback){
                conn.query(sql_rid,[data[7]],function(err,row){
                    if(err) console.error('err',err);
                    callback();
                });
            },function(callback){
                if(review_image_url.length > 0) {
                    var review_image_urll = [];
                    //console.log('length_review_image_url',review_image_url.length);
                    for(var i = 0; i < review_image_url.length; i++){
                        review_image_urll.push('public/uploads/' + review_image_url[i].substring(36));
                    }
                    //console.log(review_image_urll);
                    datas_img = review_image_urll.concat(datas_img);
                    data_img = datas_img;
                    //console.log('data_img',data_img);
                }
                callback();
            },function(callback){
                //console.log('data_img',data_img);
                //console.log('query');
                async.forEach(data_img, function(item){
                    conn.query(sql_rii,[data[7],ip+'/uploads/review'+item.substring(14),'Lose_it'],function(err,rowst){
                        if(err) console.error('err',err);
                    });
                });
                callback();
            },function(callback){
                //console.log('query--------------');
                conn.query(sqliu,[ip+'/uploads/review'+datas_img[0].substring(14),data[7]],function(err,row){
                    if(err) console.error('err',err);
                });
                callback();
            },
        ],function(err,result){
            if(err) console.error('err',err);
                //console.log('디엔드');
                success = true;
                conn.release();
                callback_e(success,data[7]);
        });
    });
}




exports.write = function(datas, datas_img, callback) {
    //console.log("1번째",datas);
	pool.getConnection(function(err, conn) {
		if(err) console.error('err',err);
		//console.log('conn',conn);
        var data_img = datas_img;
        //console.log("2번째",datas_img);
        var data_tag = datas.pop();
        //console.log("3번쨰",data_tag);
        var data = datas;
        var success = false;
        //console.log("4번쨰",data);
        //var data_ri = [datas[3],data_img,'name'];
        //profile_num은 후에 세션값을 통해 얻어오는 걸로 변환해야 함.
        //review_time날짜 형식 수정해야 함.
		var sql = 'INSERT INTO review(review_subject, review_content, category_num, review_time ,review_image_represent_path, review_image_num ,review_score, profile_num) VALUES (?,?,?,date_format(now(),"%Y-%c-%d %H:%i:%s"),?,?,?,?)';

        var sql_st = 'SELECT tag_name FROM tag WHERE tag_name = ?';

        var sql_t = 'INSERT INTO tag(tag_name) VALUES (?)';

        var sql_rt = 'INSERT INTO review_tag (review_num, tag_num) VALUES ((SELECT review_num FROM review WHERE review_image_represent_path = ? order by review_num desc limit 0, 1) , (SELECT tag_num FROM tag WHERE tag_name = ? order by tag_num desc limit 0, 1))';

        var sql_ri = 'INSERT INTO review_image (review_num, image_path, image_name) VALUES ((SELECT review_num FROM review WHERE review_image_represent_path = ? order by review_num desc limit 0, 1), ?,?)';
        var sql_rm = 'select max(review_num) max from review where profile_num = ?';
        var sqliu = 'update review set review_image_represent_path = ? where review_num = ?';

		conn.query(sql, data, function(err, row) {
            var success = false;
			if(err) console.error('err',err);

			if(row.affectedRows) {

                async.forEach(data_img,function(row,callback){
                    fse.move(row,'public/uploads/review'+row.substring(14),function(err) {
                        if (err) return console.error(err);
                    });
                    }, function(err){
                        if(err) console.log('err',err);
                });

                async.forEach(data_tag, function(item){
                    conn.query(sql_st, item, function(err, rowst){
                        if(err) console.error('err',err);
                            if(rowst.length == 0){
                                conn.query(sql_t, item, function(err, row1){
                                    if(err) console.error('err',err);
                                });
                            }
                        conn.query(sql_rt, [data[3],item], function(err, rowst){
                            if(err) console.error('err',err);
                        });
                    });
                });

                async.forEach(datas_img, function(itemi){
                    //console.log('image',itemi);
                    conn.query(sql_ri, [data[3],ip+'/uploads/review'+itemi.substring(14),itemi.substring(15)], function(err,rowim) {
                        if(err) console.error('err',err);
                    });
                });



                conn.query(sql_rm,[data[6]],function(err,row){
                    if(err) console.error('err',err);
                    success = true;
                    conn.release();
                    var max_num = {review_num : row[0].max};
                        conn.query(sqliu,[ip+'/uploads/review'+datas_img[0].substring(14),max_num.review_num],function(err,row){
                            if(err) console.error('err',err);
                            callback(success,max_num);
                        });
                });
            }
        });
    });
}


exports.delete = function(data, callback_r){
    pool.getConnection(function(err, conn){
        if(err) console.error('conn err', err);
        var success = false;
        var sql = 'UPDATE review SET review_delete = "Y" WHERE review_num = ?';
        var sql_is = 'SELECT image_path FROM review_image WHERE review_num = ?';
        var sql_ir = 'DELETE FROM review_image WHERE review_num = ?';
        var sql_rt = 'DELETE FROM review_tag WHERE review_num = ?';
        var sql_recommend_delete = 'DELETE FROM recommend WHERE review_num=?';
        conn.query(sql, data, function(err, row){
            if(err) console.error('err', err);
            if(row.affectedRows === 1){
                success = true;
            }
        });

        conn.query(sql_rt, data, function(err, row){
           if(err) console.error('err',err);
            //console.log('row_tag',row);
        });

        conn.query(sql_recommend_delete, data, function(err, row){
           if(err) console.error('err',err);
        });

        async.series([
            function(callback){
                conn.query(sql_is, data, function(err, row){
                    if(err) console.error('err',err);
                if(row.length > 0){
                    //console.log('row',"1번째" + row[0].image_path);

                        for( var i = 0; i < row.length; i++ ){
                            //console.log('image',row[i].image_path);
                            fse.remove(row[i].image_path, function(err){
                                if(err) console.error('err',err);
                            });
                        }
                }
                //console.log("1");
                });
                callback();
            },
            function(callback){;
                conn.query(sql_ir, data, function(err, row){
                    if(err) console.error('err',err);
                    success = true;
                    conn.release();
                    callback_r(success);
                });
                callback();
            }
        ], function(err, result){
            if(err) console.error('err',err);
            }
        );
    });
}

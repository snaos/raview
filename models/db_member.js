/*

 */

var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 150,
    host: '127.0.0.1',
    user: 'root',
    password: 'raviewme5',
    database: 'raview'
});
var page_size = 10;
var activity_page_size = 20;


//recommend 테이블에서 pk(user_num, review_num)이 존재하는지 판단
//callback = { message, success, err } success는 존재시 1, 아닐 경우 0.
Verify_existence_recommend = function (user_num, review_num, conn, callback) {
    var sql = 'SELECT profile_num FROM recommend WHERE profile_num=? AND review_num=?';

    conn.query(sql, [user_num, review_num], function (err, row) {
        var ver_results = {};
        if (err) {
            console.error('err', err);
            ver_results.err = err;
            ver_results.success = -1;
            callback(ver_results);
        } else {
            if (row.length == 0) {   //존재하지 않는다
                ver_results.success = 0;
                ver_results.message = "해당 유저가 게시글에 추천하지 않았습니다.";
                console.log("message", ver_results.message);
                callback(ver_results);
            } else {
                ver_results.success = 1;
                ver_results.message = "해당 유저가 게시글을 추천했었습니다."
                console.log("message", ver_results.message);
                callback(ver_results);
            }
        }
    });
}

//report 테이블에서 (user_num, review_num)이 존재하는지 판단
//callback = { message, success, err } success는 존재시 1, 아닐 경우 0
Verify_existence_report = function (user_num, review_num, conn, callback) {
    var sql = 'SELECT profile_num_get FROM report WHERE profile_num_do=? AND review_num=?';
    conn.query(sql, [user_num, review_num], function (err, row) {
        var ver_results = {};
        if (err) {
            console.error('err', err);
            ver_results.err = err;
            ver_results.success = -1;
            callback(ver_results);
        } else {
            if (row.length == 0) {   //존재하지 않는다
                ver_results.success = 0;
                ver_results.message = "해당 유저가 게시글에 신고하지 않았습니다.";
                console.log("message", ver_results.message);
                callback(ver_results);
            } else {
                ver_results.success = 1;
                ver_results.message = "해당 유저가 게시글을 신고했었습니다."
                console.log("message", ver_results.message);
                callback(ver_results);
            }
        }
    });
}

//follow 관계 확인 함수
// datas = [ profile_num_do, profile_num_get ]
Verify_existence_follow = function (datas, conn, callback) {
    var results = {};
    var sql = 'SELECT profile_num_do FROM follow WHERE profile_num_do=? AND profile_num_get=?';
    conn.query(sql, datas, function (err, row) {
        if (err) {
            results.success = 0;
            results.err = err;
        } else if (row.length == 1) {
            results.follow_status = 1;
            results.success = 1;
        } else {
            results.follow_status = 0;
            results.success = 1;
        }
        callback(results);
    });
}

//review 테이블에서 해당 review의 작성자를 찾는다.
//callback = { profile_num, success, err } success는 존재시 1, 아닐 경우 0
find_profile_num_in_review = function (review_num, conn, callback) {
    var sql = "SELECT profile_num FROM review WHERE review_num=?";
    conn.query(sql, review_num, function (err, row) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            if (row.length == 1) {        // 존재함
                var results = {
                    "profile_num": row[0].profile_num,
                    "success": 1
                };
                callback(results);
            } else {     //뭔가 잘 못됨.
                var results = {
                    "success": 0,
                    "message": "review 테이블에서 email을 찾지 못했습니다."
                };
                callback(results);
            }
        }
    });
}

//profile 테이블에서 user_num을 넘겨주어 해당 유저의 email을 찾는다
//callback = { profile_email, success, err } success는 하나 존재 시 1, 아닐 경우 0
find_email = function (user_num, conn, callback) {
    var sql = 'SELECT profile_email FROM profile WHERE profile_num=?';

    conn.query(sql, user_num, function (err, row) {
        if (err) {        //query문에서 error발생시
            console.error('err', err);
            var results = {};
            results.err = err;
            results.success = 0;
            callback(results);
        }
        else {       //query문에서 error가 발생하지 않았다.
            if (row.length == 1) {        //제대로 하나의 데이터가 선택될 경우
                var results = {};
                results.success = 1;
                results.profile_email = row[0].profile_email
                callback(results);
            } else {                     //여러 데이터가 선택될 경우
                var results = {};
                results.err = "select 결과가 많습니다";
                results.success = 0;
                callback(results);
            }
        }
    });
}

//review 테이블에서 사용자의 리뷰 수를 구한다.
count_review_num = function (user_num, conn, callback) {
    var results = {};
    var sql = 'SELECT COUNT(review_num) cnt FROM review WHERE profile_num=? AND review_delete=?';
    conn.query(sql, [user_num, 'N'], function (err, row) {
        if (err) {
            console.error('err', err);
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            results.success = 1;
            results.cnt = row[0].cnt;
            callback(results);
        }
    })
}

//recommend 테이블에서 리뷰 글의 추천 수를 구한다.
count_recommend_review = function (review_num, conn, callback) {
    var results = {};
    var sql = "SELECT COUNT(review_num) AS recommend_review FROM recommend WHERE review_num=?";
    conn.query(sql, [review_num, 'N'], function (err, row1) {
        if (err) {
            console.error('err', err);
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            results.success = 1;
            results.cnt = row1[0].recommend_review;
            callback(results);
        }
    })
}

//recoomend 테이블에서 해당 유저의 추천 수를 구한다.
count_recommend_user = function (user_num, conn, callback) {
    var results = {};
    var sql = "SELECT COUNT(p.profile_num) AS recommend_user FROM recommend AS r, profile AS p, review WHERE r.review_num=review.review_num AND review.profile_num=p.profile_num AND p.profile_num=? AND review.review_delete='N'"
    conn.query(sql, user_num, function (err, row2) {
        if (err) {
            console.error('err', err);
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            results.success = 1;
            results.cnt = row2[0].recommend_user;
            callback(results);
        }
    })
}

//follower의 수를 구한다.
count_follower_num = function (user_num, conn, callback) {
    var results = {};
    var sql = 'SELECT COUNT(profile_num_get) cnt FROM follow WHERE profile_num_get=?';
    conn.query(sql, user_num, function (err, row) {
        if (err) {
            console.error('err', err);
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            results.success = 1;
            results.cnt = row[0].cnt;
            callback(results);
        }
    })
}

//following의 수를 구한다
count_following_num = function (user_num, conn, callback) {
    var results = {};
    var sql = 'SELECT COUNT(profile_num_do) cnt FROM follow WHERE profile_num_do=?';
    conn.query(sql, user_num, function (err, row) {
        if (err) {
            console.error('err', err);
            results.err = err;
            results.success = 0;
            callback(results);
        } else {
            results.success = 1;
            results.cnt = row[0].cnt;
            callback(results);
        }
    })
}

//activity 관련 함수
//activity 에서 해당하는 리스트를 가져 온다.
activity_recommend_list = function (do_or_get, user_num, conn, callback) {
    console.log('do or get', do_or_get);
    if (do_or_get == "do") {
        var sql = " SELECT date_format(r.recommend_time,'%Y-%c-%d %H:%i:%s') AS mTime," +
            " date_format(r.recommend_time, '%Y%m%d%H%i%s') AS compareTime, " +
            "r.review_num AS review_num, r.profile_num AS profile_num, p.profile_first_name AS profile_first_name, " +
            "p.profile_last_name AS profile_last_name, review.review_subject AS review_subject, " +
            "review.review_image_represent_path AS review_image_represent_path FROM recommend AS r, " +
            "profile AS p, review WHERE review.review_num = r.review_num and p.profile_num=review.profile_num AND r.profile_num=? AND review.review_delete='N' AND r.profile_num != review.profile_num";
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }
        })
    } else {
        var sql = 'SELECT date_format(r.recommend_time,"%Y-%c-%d %H:%i:%s") AS mTime, ' +
            'date_format(r.recommend_time, "%Y%m%d%H%i%s") AS compareTime, r.review_num AS review_num, ' +
            'r.profile_num AS profile_num, p.profile_first_name AS profile_first_name, ' +
            'p.profile_last_name AS profile_last_name, p.profile_image_path AS profile_image_path,' +
            ' review.review_subject AS review_subject,' +
            ' review.review_image_represent_path AS review_image_represent_path ' +
            'FROM recommend AS r, profile AS p, review ' +
            'WHERE review.review_num = r.review_num and p.profile_num=r.profile_num and review.profile_num=? AND review.review_delete="N" AND r.profile_num != review.profile_num';
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }
        })
    }
}
activity_comment_list = function (do_or_get, user_num, conn, callback) {
    if (do_or_get == "do") {
        var sql = 'SELECT r.reply_content AS reply_content,date_format(r.reply_time,"%Y-%c-%d %H:%i:%s") ' +
            'AS mTime, date_format(r.reply_time, "%Y%m%d%H%i%s") AS compareTime,  r.review_num ' +
            'AS review_num, review.review_subject AS review_subject, review.review_image_represent_path ' +
            'AS review_image_represent_path, p.profile_first_name AS profile_first_name, ' +
            'p.profile_last_name AS profile_last_name, p.profile_num AS profile_num ' +
            'FROM reply AS r, review, profile AS p WHERE review.profile_num = p.profile_num AND ' +
            'r.review_num = review.review_num AND r.profile_num=? AND review.review_delete="N" AND r.profile_num != review.profile_num';
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }
        })
    } else {
        var sql = 'SELECT r.reply_content AS reply_content, date_format(r.reply_time,"%Y-%c-%d %H:%i:%s")' +
            ' AS mTime, date_format(r.reply_time, "%Y%m%d%H%i%s") AS compareTime, r.review_num AS review_num, ' +
            'review.review_subject AS review_subject, review.review_image_represent_path ' +
            'AS review_image_represent_path, p.profile_first_name AS profile_first_name, p.profile_last_name ' +
            'AS profile_last_name, p.profile_image_path AS profile_image_path, p.profile_num AS profile_num ' +
            'FROM reply AS r, review, profile AS p ' +
            'WHERE r.profile_num = p.profile_num and r.review_num = review.review_num AND review.profile_num=? AND review.review_delete="N" AND r.profile_num != review.profile_num';
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }
        })
    }
}
activity_follow_list = function (do_or_get, user_num, conn, callback) {
    if (do_or_get == "do") {
        var sql = 'SELECT f.profile_num_get AS profile_num_get, ' +
            'date_format(f.follow_time,"%Y-%c-%d %H:%i:%s") AS mTime, date_format(f.follow_time, "%Y%m%d%H%i%s") AS compareTime,' +
            'p.profile_first_name AS profile_first_name, ' +
            'p.profile_last_name AS profile_last_name' +
            '  FROM follow AS f, ' +
            'profile AS p WHERE f.profile_num_get=p.profile_num AND f.profile_num_do=? ';
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }
        })
    } else {
        var sql = 'SELECT f.profile_num_do AS profile_num_get, ' +
            'date_format(f.follow_time,"%Y-%c-%d %H:%i:%s") AS mTime, ' +
            'date_format(f.follow_time, "%Y%m%d%H%i%s") AS compareTime, ' +
            'p.profile_first_name AS profile_first_name,p.profile_image_path AS profile_image_path, p.profile_last_name AS profile_last_name FROM follow AS f,' +
            ' profile AS p WHERE f.profile_num_do=p.profile_num AND f.profile_num_get=?';
        conn.query(sql, user_num, function (err, rows) {
            var results = {};
            if (err) {
                results.success = 0;
                results.message = err;
                callback(results);
            } else {
                results.success = 1;
                results.rows = rows;
                callback(results);
            }

        })
    }
}

//시간 순으로 정렬
activity_buble_sort_by_compareTime = function (sorting_object, callback) {
    var temp = 0;
    var compare = sorting_object;
    for (var i = 0; i < compare.length; i++) {
        for (var j = 0; j < compare.length - 1; j++) {
            if (compare[j].compareTime < compare[j + 1].compareTime) {
                temp = compare[j];
                compare[j] = compare[j + 1];
                compare[j + 1] = temp;
            }
        }
    }
    callback(compare);
}


/*--------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * --------------------------------------------------------------------------------------------------------------------------------------------------------------------*/


//원하는 리뷰에 추천을 한다.
//var datas = [user_num, review_num];
exports.recommend = function (datas, callback) {
    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            results.message = "recommend fail";
            //conn.release();
            results.success = 1;
            callback(results);
        }
        else {
            Verify_existence_recommend(datas[0], datas[1], conn, function (verify_result) {
                if (verify_result.succss == (-1)) {       //error
                    conn.release();
                    results.success = 1;
                    results.message = "recommend fail";

                    console.error(verify_result.message);
                    conn.release();
                    callback(results);
                } else {
                    if (verify_result.success == 1) {  //존재함
                        results.success = 1;
                        results.message = "recommend fail";
                        console.error(verify_result.message);
                        conn.release();
                        callback(results);
                    } else {    //존재하지 않음.
                        var sql = "INSERT INTO recommend(profile_num,review_num,recommend_time) VALUES(?,?,now())";
                        conn.query(sql, datas, function (err, row) {
                            if (err) {
                                console.error('err', err);
                                results.message = "recommend fail";
                                results.success = 1;
                                callback(results);
                            }
                            else {      //insert 성공
                                if (row.affectedRows == 1) {
                                    count_recommend_review(datas[1], conn, function (recommend_review) {
                                        if (recommend_review.success) {       //함수 성공
                                            results.recommend_review = recommend_review.cnt;
                                            find_profile_num_in_review(datas[1], conn, function (profile_num_results) {
                                                if (profile_num_results.success) {
                                                    count_recommend_user(profile_num_results.profile_num, conn, function (recommend_user) {
                                                        if (recommend_user.success) {
                                                            results.recommend_user = recommend_user.cnt;
                                                            var callback_data = {
                                                                "results": results,
                                                                "success": 1,
                                                                "message": "recommend success"
                                                            }
                                                            console.log('in recommend , callback_data', callback_data);
                                                            conn.release();
                                                            callback(callback_data);
                                                        } else {
                                                            console.error('err', err);
                                                            results.success = 1;
                                                            results.message = "recommend fail";
                                                            conn.release();
                                                            callback(results);
                                                        }
                                                    });
                                                } else {
                                                    console.error('err', err);
                                                    results.success = 1;
                                                    results.message = "recommend fail";
                                                    conn.release();
                                                    callback(results);
                                                }
                                            })
                                        } else {
                                            console.error('err', err);
                                            results.success = 1;
                                            results.message = "recommend fail";
                                            conn.release();
                                            callback(results);
                                        }
                                    });
                                } else {
                                    results.success = 1;
                                    results.message = "recommend fail";
                                    conn.release();
                                    callback(results);
                                }
                            }
                        });
                    }
                }
            });
        }
    });
}

//원하는 리뷰에 추천을 취소한다
//var datas = [user_num, review_num];
exports.unrecommend = function (datas, callback) {
    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            results.message = "unrecommend fail";
            results.success = 1;
            //conn.release();
            callback(results);
        }
        else {
            Verify_existence_recommend(datas[0], datas[1], conn, function (verify_results) {
                if (verify_results.succss == (-1)) {       //error
                    conn.release();
                    results.success = 1;
                    results.message = "unrecommend fail";
                    conn.release();
                    callback(results);
                } else if (verify_results.success == 0) {  //존재하지 않음
                    results.success = 1;
                    results.message = "unrecommend fail";
                    conn.release();
                    callback(results);
                } else {    //존재함.
                    var sql = 'DELETE FROM recommend WHERE profile_num=? and review_num=?';
                    conn.query(sql, datas, function (err, row) {
                        if (err) {
                            console.error('err', err);
                            results.message = "unrecommend fail";
                            results.success = 1;
                            conn.release();
                            callback(results);
                        }
                        if (row.affectedRows == 1) { //성공
                            count_recommend_review(datas[1], conn, function (recommend_review) {
                                if (recommend_review.success) {       //함수 성공
                                    results.recommend_review = recommend_review.cnt;
                                    find_profile_num_in_review(datas[1], conn, function (profile_num_results) {
                                        if (profile_num_results.success) {
                                            count_recommend_user(profile_num_results.profile_num, conn, function (recommend_user) {
                                                if (recommend_user.success) {
                                                    results.recommend_user = recommend_user.cnt;
                                                    var callback_data = {
                                                        "results": results,
                                                        "success": 1,
                                                        "message": "unrecommend success"
                                                    }
                                                    conn.release();
                                                    callback(callback_data);
                                                } else {
                                                    console.error('err', err);
                                                    results.success = 1;
                                                    results.message = "unrecommend fail";
                                                    conn.release();
                                                    callback(results);
                                                }
                                            });
                                        } else {
                                            console.error('err', err);
                                            results.success = 1;
                                            results.message = "unrecommend fail";
                                            conn.release();
                                            callback(results);
                                        }
                                    })
                                } else {
                                    console.error('err', err);
                                    results.success = 1;
                                    results.message = "unrecommend fail";
                                    conn.release();
                                    callback(results);
                                }
                            });
                        } else {
                            results.success = 1;
                            results.message = "unrecommend fail";
                            conn.release();
                            callback(results);
                        }
                    })
                }
            })
        }
    })
}

//원하는 리뷰에 신고를 한다.
//var datas = [user_num, review_num];
exports.report = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "report fail";
            results.success = 1;
            callback(results);
        }
        else {
            find_profile_num_in_review(datas[1], conn, function (find_profile_num_results) {
                if (find_profile_num_results.success) {        //report 테이블에서 email을 찾았음.
                    Verify_existence_report(datas[0], datas[1], conn, function (verify_result) {
                        if (verify_result.succss == (-1)) {       //error
                            conn.release();
                            var results = {
                                "success": 1,
                                "message": "report fail"
                            }
                            conn.release();
                            callback(results);
                        } else if (verify_result.success == 1) {  //존재함
                            var results = {"success": 1, "message": "report exist"};
                            conn.release();
                            callback(results);
                        } else {    //존재하지 않음.
                            var sql = "INSERT INTO report(profile_num_do,review_num,profile_num_get,report_time) VALUES(?,?,?,now())";
                            conn.query(sql, [datas[0], datas[1], find_profile_num_results.profile_num], function (err, row) {
                                var results = {};
                                if (err) {
                                    console.error('err', err);
                                    results.message = "report fail";
                                    results.success = 1;
                                    callback(results);
                                }
                                else {      //insert 성공
                                    if (row.affectedRows == 1) {
                                        results.success = 1;
                                        results.message = "report success";
                                        conn.release();
                                        callback(results);
                                    } else {
                                        results.success = 1;
                                        results.message = "report fail";
                                        conn.release();
                                        callback(results);
                                    }
                                }
                            });
                        }

                    })
                } else {
                    //email을 찾지 못하면
                    var results = {};
                    results.success = 1;
                    results.message = "report fail";
                    conn.release();
                    callback(results);
                }
            })

        }
    });
}

//원하는 리뷰에 댓글을 남긴다.
//var datas = [user_num, review_num, reply_content];
exports.reply = function (datas, callback) {
    var empty = {
        "review_num": -1,
        "profile_num": -1,
        "profile_first_name": "",
        "profile_last_name": "",
        "reply_num": -1,
        "reply_time": "",
        "reply_content": "",
        "profile_image_path": ""
    };

    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "reply fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'INSERT INTO reply(profile_num, review_num, reply_content, reply_time) VALUES(?,?,?,now())';
            conn.query(sql, datas, function (err, row) {
                var results = {};
                if (err) {
                    console.error('err', err);
                    results.message = "reply fail";
                    results.success = 1;
                    results.results = empty;
                    conn.release();
                    callback(results);
                } else if (row.affectedRows == 1) {       //댓글 입력 성공
                    var sql = 'SELECT (SELECT profile_first_name FROM profile WHERE profile_num=?) AS profile_first_name, (SELECT profile_last_name FROM profile WHERE profile_num=?) AS profile_last_name,(SELECT profile_image_path FROM profile WHERE profile_num=?) AS profile_image_path, reply_num, date_format(reply_time,"%Y-%c-%d %H:%i:%s") reply_time, reply_content, reply_num, profile_num FROM reply WHERE profile_num=? ORDER BY reply_num DESC';
                    conn.query(sql, [datas[0], datas[0],datas[0], datas[0]], function (err, select_row) {
                        if (err) {
                            console.error('err', err);
                            results.message = "reply fail";
                            results.success = 1;
                            results.results = empty;
                            conn.release();
                            callback(results);
                        } else {
                            results.success = 1;
                            results.message = "reply success";
                            results.results = select_row[0];
                            console.log("results",results);
                            conn.release();
                            callback(results);
                        }
                    });
                } else {
                    results.success = 1;
                    results.message = "reply fail";
                    results.results = empty;
                    conn.release();
                    callback(results);
                }
            });
        }
    });

};

//원하는 댓글을 삭제한다
//var datas = [user_num, review_num, reply_num];
exports.reply_delete = function (datas, callback) {
    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            results.message = "reply delete fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'SELECT profile_num FROM reply WHERE reply_num=?';
            conn.query(sql, datas[2], function (err, row1) {
                console.log('row1', row1);
                if (row1.length == 1) {  //하나 찾음
                    if (row1[0].profile_num == datas[0]) { //해당 유저가 맞으면 삭제
                        var sql = "DELETE FROM reply WHERE reply_num=?";
                        conn.query(sql, datas[2], function (err, row2) {
                            if (err) {
                                console.error('err', err);
                                results.message = "reply delete fail";
                                results.success = 1;
                                conn.release();
                                callback(results);
                            } else {
                                if (row2.affectedRows == 1) {
                                    results.success = 1;
                                    results.message = "reply delete success";
                                    conn.release();
                                    callback(results);
                                } else {
                                    results.success = 1;
                                    results.message = "reply delete fail";
                                    conn.release();
                                    callback(results);
                                }
                            }
                        });
                    } else { //아니면 삭제를 실패
                        results.success = 1;
                        results.message = "not the writer"
                        conn.release();
                        callback(results);
                    }
                } else {          //못찾음
                    results.success = 0;
                    results.message = "reply delete fail"
                    conn.release();
                    callback(results);
                }
            });
        }
    })
}

//해당 유저와 follow관계를 형성한다.
//var datas = [user_num, email_get];
exports.follow = function (datas, callback) {
    var empty = {
        "success": 1,
        "message": "follow fail",
        "results": {
            "follow_status": -1
        }
    };
    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {        //에러 발생
            console.error('err', err);

            callback(empty);
        } else {    //잘 됨.
            conn.query('SELECT profile_num_get FROM follow WHERE profile_num_do=? and profile_num_get=?', datas, function (err, row1) {
                console.log('첫번째 셀렉트', this.sql);
                console.log('row1', row1);
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else if (row1.length == 0) {
                    console.log('팔로우 한 적이 없어서 이제 인서트 함');
                    var sql = 'INSERT INTO follow(follow_time, profile_num_do, profile_num_get) VALUES(now(),?,?)';
                    conn.query(sql, datas, function (err, row) {
                        console.log('인서트', this.sql);
                        console.log('row', row);
                        if (err) {
                            console.error('err', err);
                            conn.release();
                            callback(empty);
                        } else if (row.affectedRows == 1) {
                            var callback_data = {};
                            callback_data.success = 1;
                            callback_data.message = "follow success";
                            callback_data.results = {"follow_status": 1};
                            conn.release();
                            callback(callback_data);
                        } else {     //뭔가 잘못됨
                            console.error('err', err);
                            conn.release();
                            callback(empty);
                        }
                    });
                } else {
                    results.message = "follow exist"
                    results.success = 1;
                    results.results = {
                        "follow_status": -1
                    }
                    conn.release();
                    callback(results);
                }
            });
        }
    });
}

//해당 유저와 follow관계를 해지한다.
// var datas = [user_num, email_get];
exports.un_follow = function (datas, callback) {
    var empty = {
        "success": 1,
        "message": "unfollow fail",
        "results": {
            "follow_status": -1
        }
    };
    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {        //에러 발생
            console.error('err', err);
            callback(empty);
        } else {    //잘 됨.
            conn.query('SELECT profile_num_get FROM follow WHERE profile_num_do=? and profile_num_get=?', datas, function (err, row1) {
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else if (row1.length == 1) {
                    var sql = 'DELETE FROM follow WHERE profile_num_do=? and profile_num_get=?';
                    conn.query(sql, datas, function (err, row) {
                        if (err) {
                            console.error('err', err);
                            conn.release();
                            callback(empty);
                        } else if (row.affectedRows == 1) {
                            var callback_data = {};
                            callback_data.success = 1;
                            callback_data.message = "unfollow success";
                            callback_data.results = {"follow_status": 0};
                            conn.release();
                            callback(callback_data);
                        } else {     //뭔가 잘못됨
                            console.error('err', err);
                            conn.release();
                            callback(empty);
                        }
                    })
                } else {
                    results.message = "follow not exist"
                    conn.release();
                    results.success = 1;
                    results.results = {
                        "follow_status": -1
                    }
                    callback(results);
                }
            });
        }
    });
}

//해당 유저의 profile 정보를 보여준다.
// datas = [user_num, profile_num]
exports.profile = function (datas, callback) {
    var empty = {
        "success": 1,
        "message": "profile info fail",
        "results": {
            "profile_num": -1,
            "profile_first_name": "",
            "profile_last_name": "",
            "profile_image_path": "",
            "profile_instroduction": "",
            "profile_url": "",
            "follow_status": -1,
            "all_recommend_num": -1,
            "all_review_num": -1,
            "follow_num": -1,
            "follower_num": -1
        }
    }

    var results = {};
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err)
            callback(empty);
        } else {
            var sql = 'SELECT profile_num,profile_first_name, profile_last_name, profile_image_path, profile_introduction, profile_badge, profile_url FROM profile WHERE profile_num=?';
            conn.query(sql, datas[1], function (err, row) {
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else if (row.length == 1) {        //하나를 제대로 찾음
                    var results = row[0];
                    //follow_status 입력.
                    Verify_existence_follow(datas, conn, function (follow_results) {
                        if (follow_results.success = 0) {
                            console.error('follow_results err', follow_results);
                            conn.release();
                            callback(empty);
                        } else {
                            results.follow_status = follow_results.follow_status;
                            count_review_num(datas[1], conn, function (review_result) {
                                if (review_result.success = 0) {
                                    console.error('review_result err', review_result);
                                    conn.release();
                                    callback(empty);
                                } else {
                                    results.all_review_num = review_result.cnt;
                                    count_recommend_user(datas[1], conn, function (recommend_result) {
                                        if (recommend_result.success = 0) {
                                            console.error('recommend_result err', recommend_result);
                                            conn.release();
                                            callback(empty);
                                        } else {
                                            results.all_recommend_num = recommend_result.cnt;
                                            count_follower_num(datas[1], conn, function (follower_result) {
                                                if (follower_result.success = 0) {
                                                    console.err('follower_result err', follower_result)
                                                    conn.release();
                                                    callback(empty);
                                                }
                                                else {
                                                    results.follower_num = follower_result.cnt
                                                    count_following_num(datas[1], conn, function (following_result) {
                                                        if (following_result.success = 0) {
                                                            console.error('following_result err', following_result);
                                                            conn.release();
                                                            callback(empty);
                                                        }
                                                        else {
                                                            var callback_data = {};
                                                            results.following_num = following_result.cnt;
                                                            callback_data.results = results;
                                                            callback_data.success = 1;
                                                            callback_data.message = "profile info success"
                                                            conn.release();
                                                            callback(callback_data);
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })

                                }
                            })
                        }
                    })
                } else {                    //잘 못찾음
                    conn.release();
                    callback(empty);
                }
            });
        }
    });
}

//해당 유저와 follow관계인 유저들을 보여준다.
//following이 내가 follow한 관계
// datas = user_num(내 번호)
//

exports.following = function (datas, callback) {
    console.log('datas', datas);
    var empty = {
        "results": [
            {
                "profile_num": -1,
                "profile_image_path": "",
                "profile_first_name": "",
                "profile_last_name": ""
            }
        ],
        "success": 1,
        "message": "following fail"
    };

    var results = {};
    var page = datas[1];
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            callback(empty);
        } else {
            var sql = 'SELECT f.profile_num_get AS profile_num, p.profile_image_path AS profile_image_path, ' +
                'p.profile_first_name AS profile_first_name, p.profile_last_name AS profile_last_name ,(SELECT count(*) FROM follow WHERE profile_num_get=p.profile_num and profile_num_do=?) as follow_status ' +
                'FROM follow f, profile p WHERE f.profile_num_do=? AND f.profile_num_get=p.profile_num';
            conn.query(sql, [datas[2], datas[0]], function (err, rows) {
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else {
                    var callback_data = {};
                    var cnt = rows.length;
                    var totalPage = Math.ceil(cnt / page_size);
                    var start_num = (page - 1) * page_size;
                    var end_num = (page * page_size) - 1;
                    callback_data.results = [];
                    if (page == 1 && totalPage > 0) {           //페이지가 1페이지면 처음부터 10번이나 마지막까지(10개가 안되면)
                        for (var i = 0; (i < page_size) && i < (rows.length); i++) {
                            callback_data.results[i] = rows[i];
                            if (callback_data.results[i].profile_num == datas[2]) {
                                callback_data.results[i].follow_status = -1;
                            }
                        }
                        callback_data.success = 1;
                        callback_data.message = "following success";
                        conn.release();
                        callback(callback_data);
                    } else if (page > totalPage || totalPage == 0) {           //페이지가 최고를 넘을 경우
                        var callback_data = {
                            "results": [
                                {
                                    "profile_num": -1,
                                    "profile_image_path": "",
                                    "profile_first_name": "",
                                    "profile_last_name": ""
                                }
                            ],
                            "success": 1,
                            "message": "page is over"
                        };
                        conn.release();
                        callback(callback_data);
                    } else {                             //보통의 페이지 요청
                        if (end_num > cnt) {
                            end_num = cnt - 1;
                        }
                        for (var i = 0; i < end_num - start_num + 1; i++) {
                            callback_data.results[i] = rows[i + start_num];

                            if (callback_data.results[i].profile_num == datas[2]) {
                                callback_data.results[i].follow_status = -1;
                            }
                        }
                        callback_data.success = 1;
                        callback_data.message = "following success";
                        conn.release();
                        callback(callback_data);
                    }
                }
            });
        }
    });
};


//나를 follow하고 있는 사람들을 보여준다
// datas = user_num(내 번호)

exports.follower = function (datas, callback) {
    console.log('datas', datas);
    var empty = {
        "results": [
            {
                "profile_num": -1,
                "profile_image_path": "",
                "profile_first_name": "",
                "profile_last_name": ""
            }
        ],
        "success": 1,
        "message": "follower fail"
    };

    var results = {};
    var page = datas[1];
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            callback(empty);
        } else {
            var sql = 'SELECT f.profile_num_do AS profile_num, p.profile_image_path AS profile_image_path, ' +
                'p.profile_first_name AS profile_first_name, p.profile_last_name AS profile_last_name, ' +
                '(SELECT count(*) FROM follow WHERE profile_num_get=p.profile_num and profile_num_do=?) as follow_status  ' +
                'FROM follow f, profile p WHERE f.profile_num_get=? AND f.profile_num_do=p.profile_num'
            conn.query(sql, [datas[2], datas[0]], function (err, rows) {
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else {
                    var callback_data = {};
                    var cnt = rows.length;
                    var totalPage = Math.ceil(cnt / page_size);
                    var start_num = (page - 1) * page_size;
                    var end_num = (page * page_size) - 1;
                    callback_data.results = [];
                    if (page == 1 && totalPage > 0) {           //페이지가 1페이지면 처음부터 10번이나 마지막까지(10개가 안되면)
                        for (var i = 0; (i < page_size) && i < (rows.length); i++) {
                            callback_data.results[i] = rows[i];
                            if (callback_data.results[i].profile_num == datas[2]) {
                                callback_data.results[i].follow_status = -1;
                            }
                        }
                        callback_data.success = 1;
                        callback_data.message = "follower success";
                        conn.release();
                        callback(callback_data);
                    } else if (page > totalPage || totalPage == 0) {           //페이지가 최고를 넘을 경우
                        var callback_data = {
                            "success": 1,
                            "message": "page is over",
                            "results": [
                                {
                                    "profile_num": -1,
                                    "profile_image_path": "",
                                    "profile_first_name": "",
                                    "profile_last_name": ""
                                }
                            ]
                        };
                        conn.release();
                        callback(callback_data);
                    } else {                             //보통의 페이지 요청
                        if (end_num > cnt) {
                            end_num = cnt - 1;
                        }
                        for (var i = 0; i < end_num - start_num + 1; i++) {
                            callback_data.results[i] = rows[i + start_num];

                            if (callback_data.results[i].profile_num == datas[2]) {
                                callback_data.results[i].follow_status = -1;
                            }
                        }
                        callback_data.success = 1;
                        callback_data.message = "follower success";
                        conn.release();
                        callback(callback_data);
                    }
                }
            });
        }
    })
}

//해당 유저의 리뷰글 리스트를 불러온다.
// datas = [user_name, page];
exports.profile_review_list = function (datas, callback) {
    var empty = {
        "success": 1,
        "message": "profile review list fail",
        "results": [
            {
                "profile_num": -1,
                "profile_first_name": "",
                "profile_last_name": "",
                "profile_image_path": "",
                "review_subject": "",
                "review_image_num": -1,
                "review_image_represent_path": "",
                "review_score": -1,
                "review_num": -1,
                "review_content": -1
            }
        ]
    }

    var page = datas[1];
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            callback(empty);
        } else {
            var sql = 'SELECT p.profile_num AS profile_num, p.profile_first_name AS profile_first_name, ' +
                'p.profile_last_name AS profile_last_name, p.profile_image_path AS profile_image_path, ' +
                'r.review_image_represent_path AS review_image_represent_path, r.review_subject AS review_subject, ' +
                'r.review_image_num AS review_image_num, r.review_score AS review_score, r.review_num AS review_num,' +
                ' r.review_content AS review_content FROM profile p, review r WHERE p.profile_num = r.profile_num and p.profile_num=?  AND r.review_delete="N" ORDER BY review_num DESC';

            conn.query(sql, datas[0], function (err, rows) {
                if (err) {
                    var results = {};
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else {        //리뷰 리스트가 제대로 도착.
                    var results = [];
                    if (page == 1) {
                        //페이지가 1이면 10개보여주던지, 1페이지를 다 못채우면 최대 길이만큼 results에 넣어준다.
                        for (var i = 0; i < 10 && i < rows.length; i++) {
                            results[i] = rows[i];
                        }
                        var callback_data = {
                            "success": 1,
                            "message": "profile review list success"
                        };
                        callback_data.results = results;
                        conn.release();
                        console.log('results', results);
                        callback(callback_data);
                    } else {     //1페이지가 아니면
                        var cnt = rows.length;                          //리뷰글의 숫자.
                        var totalPage = Math.ceil(cnt / page_size);          //총 페이지의 수
                        if (page > totalPage) {            //최대 페이지 수를 넘어서 요청함.
                            var callback_data = {
                                "success": 1,
                                "message": "page is over"
                            };
                            results = [];
                            conn.release();
                            callback_data.results = results;
                            callback(callback_data);
                        } else {
                            var start_review_num = ((page - 1) * page_size);       //시작 리뷰 번호
                            var end_review_num = ((page * page_size) - 1);         //끝 리뷰 번호
                            if (end_review_num > cnt) {
                                end_review_num = cnt - 1;
                            }       //마지막 리뷰 숫자가 최대 숫자보다 크면 최대 숫자로
                            for (var i = 0; i < end_review_num - start_review_num + 1; i++) {
                                results[i] = rows[start_review_num + i];
                            }
                            var callback_data = {
                                "success": 1,
                                "message": "profile review list success"
                            };
                            callback_data.results = results;
                            console.log('results', results);
                            conn.release();
                            callback(callback_data);
                        }
                    }
                }
            });
        }
    });
}
//다른사람들이 내게 한 활동을 보여준다
// datas = [user_num, page]
exports.activity_others = function (datas, callback) {

    var page = datas[1];

    var empty = {
        "info": "",
        "mTime": "",
        "profile_num": -1,
        "profile_first_name": "",
        "profile_last_name": "",
        "profile_image_path": "",
        "review_num": -1,
        "review_subject": "",
        "review_image_represent_path": "",
        "reply_content": "",
        "compareTime": -1
    }

    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "activity fail";
            results.results = [];
            results.results[0] = empty;
            //conn.release();
            results.success = 1;
            callback(results);
        }
        else {
            activity_comment_list("get", datas[0], conn, function (comment) {
                if (comment.success == 1) {
                    if (comment.rows.length != 0) {
                        var comment_results = comment.rows;
                        for (var i = 0; i < comment_results.length; i++) {
                            comment_results[i].info = "comment";
                        }
                    }
                    activity_recommend_list("get", datas[0], conn, function (recommend) {
                        if (recommend.success == 1) {
                            if (recommend.rows.length != 0) {
                                var recommend_results = recommend.rows;
                                for (var i = 0; i < recommend_results.length; i++) {
                                    recommend_results[i].info = "recommend";
                                    recommend_results[i].reply_content = "";
                                }
                            }
                            activity_follow_list("get", datas[0], conn, function (follow) {
                                if (follow.success == 1) {
                                    if (follow.rows.length != 0) {
                                        var follow_results = follow.rows;
                                        for (var i = 0; i < follow_results.length; i++) {
                                            follow_results[i].info = "follow";
                                            follow_results[i].review_num = -1;
                                            follow_results[i].review_subject = "";
                                            follow_results[i].review_image_represent_path = "";
                                            follow_results[i].reply_content = "";
                                        }
                                    }

                                    var results = [];
                                    //console.log("recommend_results",recommend_results);
                                    //console.log("comment_results",comment_results);
                                    //console.log("follow_results",follow_results);
                                    if (follow.rows.length != 0) {
                                        results = results.concat(follow_results);
                                    }
                                    if (comment.rows.length != 0) {
                                        results = results.concat(comment_results);
                                        console.log('results', results);
                                    }
                                    if (recommend.rows.length != 0) {
                                        results = results.concat(recommend_results);
                                        console.log('results', results);
                                    }
                                    if (recommend.rows.length == 0 && comment.rows.length == 0 && follow.rows.length == 0) {
                                        results[0] = empty;
                                        var callback_data = {"success": 1};
                                        callback_data.message = "activity is empty";
                                        callback_data.results = [];
                                        callback_data.results[0] = empty;
                                        conn.release();
                                        callback(callback_data);
                                    } else {
                                        activity_buble_sort_by_compareTime(results, function (sorting_results) {
                                            var result_page = [];
                                            console.log("sorting_results", sorting_results);
                                            if (page == 1 && totalPage > 0) {
                                                for (var i = 0; i < 10 && i < sorting_results.length; i++) {
                                                    result_page[i] = sorting_results[i];
                                                    result_page[i].profile_num = result_page[i].profile_num_get;

                                                }
                                                var callback_data = {};
                                                callback_data.results = result_page;
                                                callback_data.success = 1;
                                                callback_data.message = "activity success"
                                                conn.release();
                                                callback(callback_data);
                                            } else {
                                                var cnt = sorting_results.length;   //전체 activity수
                                                var totalPage = Math.ceil(cnt / page_size);
                                                if (page > totalPage || totalPage == 0) {
                                                    var callback_data = {
                                                        "success": 1,
                                                        "message": "page is over"
                                                    };
                                                    var result_page = [];
                                                    result_page[0] = empty;
                                                    callback_data.results = result_page;
                                                    conn.release();
                                                    callback(callback_data);
                                                } else {
                                                    var result_page = [];
                                                    var start_activity_num = ((page - 1) * activity_page_size);       //시작 activity 번호
                                                    var end_activity_num = ((page * activity_page_size) - 1);         //끝 activity 번호
                                                    if (end_activity_num > cnt) {
                                                        end_activity_num = cnt - 1;
                                                    }       //마지막 리뷰 숫자가 최대 숫자보다 크면 최대 숫자로
                                                    for (var i = 0; i < end_activity_num - start_activity_num + 1; i++) {
                                                        result_page[i] = sorting_results[start_activity_num + i];
                                                        result_page[i].profile_num = result_page[i].profile_num_get;

                                                    }
                                                    var callback_data = {
                                                        "success": 1,
                                                        "message": "activity success"
                                                    };
                                                    callback_data.results = result_page;
                                                    conn.release();
                                                    callback(callback_data);
                                                }
                                            }
                                        });
                                    }
                                } else {
                                    var results = {};
                                    console.error('err', err);
                                    results.message = "activity fail";
                                    results.results = [empty];
                                    conn.release();
                                    results.success = 1;
                                    callback(results);
                                }
                            })
                        } else { //에러
                            var results = {};
                            console.error('err', err);
                            results.message = "activity fail";
                            results.results = [empty];
                            conn.release();
                            results.success = 1;
                            callback(results);
                        }
                    })
                } else {//에러
                    var results = {};
                    console.error('err', err);
                    results.message = "activity fail";
                    results.results = [empty];
                    conn.release();
                    results.success = 1;
                    callback(results);
                }
            });
        }
    });
}

exports.activity_me = function (datas, callback) {

    var page = datas[1];

    var empty = {
        "info": "",
        "mTime": "",
        "profile_num": -1,
        "profile_first_name": "",
        "profile_last_name": "",
        "review_num": -1,
        "review_subject": "",
        "review_image_represent_path": "",
        "reply_content": "",
        "compareTime": -1
    }

    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "activity fail";
            results.results = [empty];
            //conn.release();
            results.success = 1;
            callback(results);
        }
        else {
            activity_comment_list("do", datas[0], conn, function (comment) {
                if (comment.success == 1) {
                    if (comment.rows.length != 0) {
                        var comment_results = comment.rows;
                        for (var i = 0; i < comment_results.length; i++) {
                            comment_results[i].info = "comment";
                        }
                    }
                    activity_recommend_list("do", datas[0], conn, function (recommend) {
                        if (recommend.success == 1) {
                            if (recommend.rows.length != 0) {
                                var recommend_results = recommend.rows;
                                for (var i = 0; i < recommend_results.length; i++) {
                                    recommend_results[i].info = "recommend";
                                    recommend_results[i].reply_content = "";
                                }
                            }
                            activity_follow_list("do", datas[0], conn, function (follow) {
                                if (follow.success == 1) {
                                    if (follow.rows.length != 0) {
                                        var follow_results = follow.rows;
                                        for (var i = 0; i < follow_results.length; i++) {
                                            follow_results[i].info = "follow";
                                            follow_results[i].review_num = -1;
                                            follow_results[i].review_subject = "";
                                            follow_results[i].review_image_represent_path = "";
                                            follow_results[i].reply_content = "";
                                        }
                                    }
                                    var results = [];
                                    if (follow.rows.length != 0) {
                                        results = results.concat(follow_results);
                                    }
                                    if (comment.rows.length != 0) {
                                        results = results.concat(comment_results);
                                    }
                                    if (recommend.rows.length != 0) {
                                        results = results.concat(recommend_results);
                                    }

                                    if (recommend.rows.length == 0 && comment.rows.length == 0 && follow.rows.length == 0) {
                                        results[0] = empty;
                                        var callback_data = {"success": 1};
                                        callback_data.message = "activity is empty";
                                        callback_data.results = results;
                                        conn.release();
                                        callback(callback_data);
                                    } else {
                                        console.log('results', results);
                                        activity_buble_sort_by_compareTime(results, function (sorting_results) {
                                            var cnt = sorting_results.length;   //전체 activity수
                                            var totalPage = Math.ceil(cnt / activity_page_size);
                                            var result_page = [];
                                            if (page == 1 && totalPage > 0) {
                                                for (var i = 0; i < 10 && i < sorting_results.length; i++) {
                                                    result_page[i] = sorting_results[i];
                                                    result_page[i].profile_num = result_page[i].profile_num_get;
                                                }
                                                var callback_data = {};
                                                callback_data.results = result_page;
                                                callback_data.success = 1;
                                                callback_data.message = "activity success"
                                                console.log(callback_data);
                                                conn.release();
                                                callback(callback_data);
                                            } else {

                                                if (page > totalPage || totalPage == 0) {
                                                    var callback_data = {
                                                        "success": 1,
                                                        "message": "page is over"
                                                    };
                                                    var result_page = [];
                                                    result_page[0] = empty;
                                                    callback_data.results = result_page;
                                                    conn.release();
                                                    callback(callback_data);
                                                } else {
                                                    var result_page = [];
                                                    var start_activity_num = ((page - 1) * activity_page_size);       //시작 activity 번호
                                                    var end_activity_num = ((page * activity_page_size) - 1);         //끝 activity 번호
                                                    if (end_activity_num > cnt) {
                                                        end_activity_num = cnt - 1;
                                                    }       //마지막 리뷰 숫자가 최대 숫자보다 크면 최대 숫자로
                                                    for (var i = 0; (i < end_activity_num - start_activity_num + 1); i++) {
                                                        result_page[i] = sorting_results[start_activity_num + i];
                                                        result_page[i].profile_num = result_page[i].profile_num_get;
                                                    }
                                                    var callback_data = {
                                                        "success": 1,
                                                        "message": "activity success"
                                                    };
                                                    callback_data.results = result_page;
                                                    console.log('callback_data', callback_data);
                                                    conn.release();
                                                    callback(callback_data);
                                                }
                                            }
                                        });
                                    }
                                } else {
                                    var results = {};
                                    console.error('err', err);
                                    results.message = "activity fail";
                                    results.results = [empty];
                                    conn.release();
                                    results.success = 1;
                                    callback(results);
                                }
                            })
                        } else { //에러
                            var results = {};
                            console.error('err', err);
                            results.message = "activity fail";
                            results.results = [empty];
                            conn.release();
                            results.success = 1;
                            callback(results);
                        }
                    })
                } else {//에러
                    var results = {};
                    console.error('err', err);
                    results.message = "activity fail";
                    conn.release();
                    results.success = 1;
                    callback(results);
                }
            });
        }
    });
}

//DB에서 location을 가져온다.
exports.location = function (callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "location fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'SELECT location_num, location_name FROM location ORDER BY location_name';
            conn.query(sql, [], function (err, rows) {
                if (err) {
                    var results = {};
                    console.error('err', err);
                    results.message = "location fail";
                    conn.release();
                    results.success = 1;
                    callback(results);
                } else {
                    var results = {};
                    results.results = rows;
                    results.success = 1;
                    results.message = "location success";
                    conn.release();
                    callback(results);
                }
            });
        }
    })
}
//DB에서 카테고리 리스트를 불러온다.
exports.category = function (callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "category fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'SELECT category_num, category_name, category_image FROM category';
            conn.query(sql, [], function (err, rows) {
                if (err) {
                    var results = {};
                    console.error('err', err);
                    results.message = "category fail";
                    conn.release();
                    results.success = 1;
                    callback(results);
                } else {
                    var results = {};
                    results.results = rows;
                    results.success = 1;
                    results.message = "category success";
                    conn.release();
                    callback(results);
                }
            });
        }
    });
}

// datas = [profile_num, gcm_token]
exports.gcm_register = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "gcm register fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'INSERT INTO gcm(profile_num, gcm_token) VALUES(?,?)';
            conn.query(sql, datas, function (err, row) {
                if (err) {
                    var results = {};
                    console.error('err', err);
                    results.message = "gcm register fail";
                    results.success = 1;
                    callback(results);
                } else if (row.affectedRows == 1) {
                    var results = {};
                    results.message = "gcm register success";
                    results.success = 1;
                    callback(results);
                } else {
                    var results = {};
                    console.error('err', err);
                    results.message = "gcm register fail";
                    results.success = 1;
                    callback(results);
                }
            })
        }
    })
}


//gcm nf 페이지 요청
exports.gcm_nf = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        var sql = 'SELECT gcm_follow, gcm_recommend, gcm_comment FROM profile WHERE profile_num=?';
        if (err) {
            console.error('err', err);
            var results = {};
            results.success = 1;
            results.message = "gcm fail";
            results.results = {
                "gcm_follow": "",
                "gcm_recommend": "",
                "gcm_comment": ""
            }
            callback(results);
        } else {
            conn.query(sql, datas, function (err, row) {
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.success = 1;
                    results.message = "gcm fail";
                    results.results = {
                        "gcm_follow": "",
                        "gcm_recommend": "",
                        "gcm_comment": ""
                    }
                    conn.release();
                    callback(results);
                } else if (row.length == 1) {
                    var callback_datas = {};
                    callback_datas.results = row;
                    callback_datas.success = 1;
                    callback_datas.message = "gcm success";
                    conn.release();
                    callback(callback_datas);
                } else {
                    var results = {};
                    results.success = 1;
                    results.message = "gcm fail";
                    results.results = {
                        "gcm_follow": "",
                        "gcm_recommend": "",
                        "gcm_comment": ""
                    }
                    conn.release();
                    callback(results);
                }
            });
        }
    });
}

//datas = [follow, reccomend, comment, user_num]
exports.gcm_edit = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var results = {};
            console.error('err', err);
            results.message = "gcm edit fail";
            results.success = 1;
            callback(results);
        } else {
            var sql = 'UPDATE profile SET gcm_follow=?, gcm_reccomend=?, gcm_comment=? WHERE profile_num=?'
            conn.query(sql, datas, function (err, row) {
                if (err) {
                    var results = {};
                    console.error('err', err);
                    results.message = "gcm edit fail";
                    conn.release();
                    results.success = 1;
                    callback(results);
                } else if (row.affectedRows == 1) { //update 성공
                    var callback_data = {};
                    callback_data.success = 1;
                    callback_data.message = "gcm edit success";
                    conn.release();
                    callback(callback_data);
                } else {
                    var results = {};
                    results.message = "gcm edit fail";
                    conn.release();
                    results.success = 1;
                    callback(results);
                }
            });
        }
    });
}


// var datas = [gcm_info, profile_num, user_num, review_num, reply_content];
// profile_num은 상대 번호, user_num은 내 번호
exports.gcm_send = function (datas, callback) {
    console.log('datas',datas);
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.success = 1;
            results.message = "gcm send fail";
            callback(results);
        } else {
            {
                var sql = "SELECT profile_num FROM review WHERE review_num=?";
                conn.query(sql, datas[3], function (err, row0) {
                    console.log('review의 profile_num row0',row0);
                    if (err) {
                        console.error('err', err);
                        var callback_results = {};
                        callback_results.success = 1;
                        callback_results.message = "gcm send fail";
                        conn.release();
                        callback(callback_results);
                    } else {
                        if (row0.length != 0) {    //review_num이 0번 == follow
                            //recommend와 comment의 경우 review_num을 통한 profile_num이 필요
                            datas[1] = row0[0].profile_num;
                        }
                        var sql = "SELECT gcm.gcm_token AS gcm_token, p.gcm_follow AS gcm_follow, p.gcm_recommend AS gcm_recommend," +
                            " p.gcm_comment AS gcm_comment, p.profile_num AS profile_num,p.profile_last_name AS profile_last_name," +
                            " p.profile_first_name AS profile_first_name, p.profile_image_path AS profile_image_path " +
                            "FROM gcm, profile AS p WHERE p.profile_num=? AND p.profile_num=gcm.profile_num";
                        conn.query(sql, datas[1], function (err, row) { //gcm을 받을 사용자의 gcm정보와 프로필 넘버
                            console.log('in gcm, select row',row);
                            if (err) {
                                console.error('err', err);
                                var callback_results = {};
                                callback_results.success = 1;
                                callback_results.message = "gcm send fail";
                                conn.release();
                                callback(callback_results);
                            } else if (row.length == 1) { //row에 gcm_token이 옴.
                                if (datas[0] == 'recommend') {    //추천일 경우
                                    var sql = 'SELECT p.profile_num AS profile_num, p.profile_first_name AS profile_first_name, ' +
                                        'p.profile_last_name AS profile_last_name, review.review_num AS review_num, review.review_image_represent_path ' +
                                        'AS review_image_represent_path,p.profile_image_path AS profile_image_path ,review.review_subject AS review_subject, r.recommend_time AS mTime FROM recommend AS r,profile AS p, ' +
                                        'review WHERE r.review_num=review.review_num AND p.profile_num=? AND review.review_num=? AND p.profile_num=r.profile_num'
                                    conn.query(sql, [datas[2], parseInt(datas[3])], function (err, recommend_row) {
                                        if (err) {
                                            console.error('err', err);
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        } else if (recommend_row.length == 1) {
                                            var callback_results = {};
                                            callback_results.results = recommend_row[0];
                                            callback_results.info = datas[0];
                                            //채우기용 데이터
                                            callback_results.results.reply_content = "";
                                            callback_results.success = 1;
                                            callback_results.token = row[0].gcm_token;
                                            callback_results.message = datas[0]+"&"+recommend_row[0].profile_num+"&"+recommend_row[0].profile_image_path+"&"+recommend_row[0].profile_last_name+" "+recommend_row[0].profile_first_name+"&"+recommend_row[0].profile_last_name+" "+recommend_row[0].profile_first_name+" recommended your reivew&"+row[0].gcm_recommend+"&"+datas[3];
                                            console.log('callback_results',callback_results);

                                            conn.release();
                                            callback(callback_results);
                                        } else {
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        }
                                    })
                                } else if (datas[0] == 'follow') {         //follow일 경우
                                    console.log("in follow!? datas[0] == 'follow'",datas[0] == 'follow');
                                    var sql = 'SELECT p.profile_num AS profile_num, p.profile_first_name AS profile_first_name, ' +
                                        'p.profile_last_name AS profile_last_name, p.profile_image_path AS profile_image_path, ' +
                                        'f.follow_time AS mTime FROM follow AS f, profile AS p WHERE f.profile_num_do=? ' +
                                        'AND p.profile_num=f.profile_num_do AND f.profile_num_get=?'
                                    conn.query(sql, [datas[2], datas[1]], function (err, follow_row) {
                                        console.log('follow_row',follow_row);
                                        if (err) {
                                            console.error('err', err);
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        } else if (follow_row.length == 1) {
                                            var callback_results = {};
                                            callback_results.results = follow_row;
                                            callback_results.info = datas[0];
                                            //채우기용 데이터
                                            callback_results.results.review_num = -1;
                                            callback_results.results.review_subject = "";
                                            callback_results.results.review_image_represent_path = "";
                                            callback_results.results.reply_content = "";
                                            callback_results.success = 1;
                                            callback_results.token = row[0].gcm_token;
                                            callback_results.message = datas[0]+"&"+follow_row[0].profile_num+"&"+follow_row[0].profile_image_path+"&"+follow_row[0].profile_last_name+" "+follow_row[0].profile_first_name+"&"+follow_row[0].profile_last_name+" "+follow_row[0].profile_first_name+" started following you&"+row[0].gcm_follow+"&"+datas[3];
                                            callback_results.setting = row[0]
             console.log('callback_results',callback_results);

                                            conn.release();
                                            callback(callback_results);
                                        } else {
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        }
                                    })
                                } else if (datas[0] == 'comment') {        //comment, 댓글
                                    console.log('in comment?! ');
                                    var sql = 'SELECT review.review_num, review.profile_num AS review_writer,r.reply_content AS reply_content , r.reply_time AS mTime ,p.profile_image_path AS profile_image_path, r.reply_num, ' +
                                        'r.profile_num AS profile_num, p.profile_first_name AS profile_first_name, ' +
                                        'p.profile_last_name AS profile_last_name, review.review_num AS review_num,' +
                                        ' review.review_subject AS review_subject, review.review_image_represent_path AS review_image_represent_path' +
                                        ',  review.profile_num FROM reply AS r,profile AS p, review WHERE r.profile_num=? ' +
                                        'AND r.profile_num=p.profile_num AND r.review_num = review.review_num ORDER BY r.reply_num DESC';
                                    conn.query(sql, datas[2], function (err, comment_row) {
                                        console.log('row',row);
                                        if (err) {
                                            console.error('err', err);
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        } else if (comment_row.length > 0) {
                                            var callback_results = {};
                                            callback_results.results = comment_row;
                                            callback_results.info = datas[0];
                                            callback_results.token = row[0].gcm_token;
                                            callback_results.message = datas[0]+"&"+comment_row[0].profile_num+"&"+comment_row[0].profile_image_path+"&"+comment_row[0].profile_last_name+" "+comment_row[0].profile_first_name+"&"+comment_row[0].profile_last_name+" "+comment_row[0].profile_first_name +" commented on your review&"+row[0].gcm_comment+"&"+datas[3];
                                            callback_results.setting = row[0]
                                            console.log('callback_results',callback_results);

                                            conn.release();
                                            callback(callback_results);
                                        } else {
                                            var callback_results = {};
                                            callback_results.success = 1;
                                            callback_results.message = "gcm send fail";
                                            conn.release();
                                            callback(callback_results);
                                        }
                                    });

                                } else {
                                    //사용자가 해당 gcm전송을 N으로 해놓음.
                                }
                            } else {
                                var callback_results = {};
                                callback_results.success = 1;
                                callback_results.message = "gcm send fail";
                                conn.release();
                                callback(callback_results);
                            }
                        });
                    }
                });
            }
        }
    })
}




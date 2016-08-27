/**
 * Created by user on 2015-02-05.
 */


var mysql = require('mysql');
var crypto = require('crypto');

var pool = mysql.createPool({
    connectionLimit: 150,
    host: '127.0.0.1',
    user: 'root',
    password: 'raviewme5',
    database: 'raview'
});

var iterations = 1000;      //암호화 반복 횟수
var keylen = 24;    //암호화 후 생성되는 key 길이 설정


//datas = url
exports.email_auth_update = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var callback_datas = {};
            callback_datas.success = 1;
            callback_datas.message = "auth update fail";
            conn.release();
            callback(callback_datas);
        } else {
            var sql = 'UPDATE valid_email SET valid=? WHERE auth_url=?';
            conn.query(sql, ['Y', datas], function (err, row) {
                if (err) {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "auth update fail";
                    conn.release();
                    callback(callback_data);
                } else if (row.affectedRows == 1) {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "auth update success";
                    conn.release();
                    callback(callback_datas);
                } else {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "auth update fail";
                    conn.release();
                    callback(callback_datas);
                }
            });
        }
    });
}

exports.email_auth_check = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err',err);
            var callback_datas = {};
            callback_datas.success = 1;
            callback_datas.message = "check err";
            callback(callback_datas);
        } else {
            var sql = 'SELECT valid FROM valid_email WHERE profile_email=?';
            conn.query(sql, datas, function (err, row) {
                if (err) {
                    console.error('err',err);
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "check err";
                    conn.release();
                    callback(callback_datas);
                } else if(row.length == 0){
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "not valid email";
                    conn.release();
                    callback(callback_datas);
                } else if (row[0].valid == 'Y') {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "valid email";
                    conn.release();
                    callback(callback_datas);
                } else {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "not valid email";
                    conn.release();
                    callback(callback_datas);
                }
            });
        }
    })
}

//datas = email
exports.send_email = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            var callback_datas = {};
            callback_datas.success = 1;
            callback_datas.message = "send email fail";
            conn.release();
            callback(callback_datas);
        } else {
            var pw = Math.round(Math.random() * 1000000) + '';
            var salt = Math.round((new Date().valueOf() * Math.random())) + '';//salt값 생성
            var key = crypto.pbkdf2Sync(pw, salt, iterations, keylen);  //암호화
            var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
            var sql = 'INSERT INTO valid_email(profile_email, valid, auth_url) VALUES(?,?,?)';
            conn.query(sql, [datas, 'N', pw_cryp], function (err, row) {
                if (err) {
                    console.error('err',err)
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "send email exist";

                    var sql = 'SELECT auth_url,valid FROM valid_email WHERE profile_email=?'
                    conn.query(sql, datas, function (err, row) {
                        if(err){
                            console.error('err',err);
                            callback_datas.url = ""
                        }else if(row.length==1){
                            callback_datas.url = row[0].auth_url;
                        }else {
                            callback_datas.url = "";
                        }
                        callback_datas.valid = row[0].valid;
                        conn.release();
                        callback(callback_datas);
                    })

                } else if (row.affectedRows == 1) {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "send email success";
                    callback_datas.url = pw_cryp;
                    conn.release();
                    callback(callback_datas);
                } else {
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "send email fail";
                    callback_datas.url = "";
                    conn.release();
                    callback(callback_datas);
                }
            });
        }
    })
}

//비밀번호 찾기
// datas = profile_email
exports.sent_password = function (datas, callback) {
    var pw = Math.round(Math.random() * 1000000) + '';
    if(pw < 100000){
        pw = "00000"+pw+"11";
    }
    var salt = Math.round((new Date().valueOf() * Math.random())) + '';//salt값 생성
    var key = crypto.pbkdf2Sync(pw, salt, iterations, keylen);  //암호화
    var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
    console.log('pw_cryp',pw_cryp);
    console.log('pw',pw);
    console.log('salt',salt);


    var update = [pw_cryp, salt, datas];
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "forgot password fail";
            results.success = 1;
            callback(results);
        }
        var sql = 'UPDATE profile SET profile_password=?, profile_salt=? WHERE profile_email=?';
        conn.query(sql, update, function (err, row) {
            if (err) {
                var results = {};
                results.message = "forgot password fail";
                results.success = 1;
                results.pw = "";
                conn.release();
                callback(results);
            } else if (row.affectedRows == 1) {
                conn.query('SELECT profile_first_name, profile_last_name FROM profile WHERE profile_email=?', datas, function(err, rows) {
                        var results = {};
                        results.message = "forgot password success";
                        results.success = 1;
                        results.pw = pw;
                        results.first = rows[0].profile_first_name;
                        results.last = rows[0].profile_last_name;
                        conn.release();
                        callback(results);
                })
            } else {
                var results = {};
                results.message = "check email";
                results.success = 1;
                results.pw = "";
                conn.release();
                callback(results);
            }
        })
    })
}

//gcm nf 페이지 요청
exports.gcm_nf = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        var sql = 'SELECT gcm_follow, gcm_recommend, gcm_comment FROM gcm WHERE profile_num=?';
        if(err){
            console.error('err',err);
            var results = {};
            results.success = 1;
            results.message = "gcm fail";
            results.results = {
                "gcm_follow" : "",
                "gcm_recommend" : "",
                "gcm_comment" : ""
            }
            callback(results);
        } else {
            conn.query(sql, datas, function (err, row) {
                if(err){
                    console.error('err',err);
                    var results = {};
                    results.success = 1;
                    results.message = "gcm fail";
                    results.results = {
                        "gcm_follow" : "",
                        "gcm_recommend" : "",
                        "gcm_comment" : ""
                    }
                    conn.release();
                    callback(results);
                }else if(row.length== 1){
                    var callback_datas = {};
                    callback_datas.results = row;
                    callback_datas.success = 1;
                    callback_datas.message = "gcm success";
                    conn.release();
                    callback(callback_datas);
                }else {
                    var results = {};
                    results.success = 1;
                    results.message = "gcm fail";
                    results.results = {
                        "gcm_follow" : "",
                        "gcm_recommend" : "",
                        "gcm_comment" : ""
                    }
                    conn.release();
                    callback(results);
                }
            })
        }
    })
}
//var datas = [gcm_follow, gcm_recommend, gcm_comment, user_num];
exports.gcm_nf_save = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        var sql = 'UPDATE gcm SET gcm_follow=?, gcm_recommend=?, gcm_comment=? WHERE profile_num=?';
        if(err){
            console.error('err',err);
            var results = {};
            results.success = 1;
            results.message = "gcm save fail";
            callback(results);
        } else {
            conn.query(sql, datas, function (err, row) {
                if(err){
                    console.error('err',err);
                    var results = {};
                    results.success = 1;
                    results.message = "gcm save fail";
                    conn.release();
                    callback(results);
                }else if(row.affectedRows == 1){
                    var callback_datas = {};
                    callback_datas.success = 1;
                    callback_datas.message = "gcm save success";
                    conn.release();
                    callback(callback_datas);
                }else {
                    var results = {};
                    results.success = 1;
                    results.message = "gcm save fail";
                    conn.release();
                    callback(results);
                }
            })
        }
    })
}
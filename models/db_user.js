/*
 fb, google 관련된 것은 보류.
 인증 관련도 보류.
 비밀번호 찾기
 */

var mysql = require('mysql');
var crypto = require('crypto');
var fs = require('fs-extra');
var request = require('request');

//인코딩
var Iconv = require('iconv');

var pool = mysql.createPool({
    connectionLimit: 150,
    host: '127.0.0.1',
    user: 'root',
    password: 'raviewme5',
    database: 'raview'
});

var page_size = 10;
var iterations = 1000;      //암호화 반복 횟수
var keylen = 24;    //암호화 후 생성되는 key 길이 설정
var ip = "http://54.65.222.144/";

//uri에서 이미지를 다운로드 하기
var download = function (uri, filename, callback) {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};


//email 회원 가입.
// datas = [first_name, last_name, password, email, gender, location, birth];
// gcm_data = gcm
exports.signup = function (datas, gcm_data, callback) {
    var pw = datas[2] + "";
    var salt = Math.round((new Date().valueOf() * Math.random())) + '';//salt값 생성
    var key = crypto.pbkdf2Sync(pw, salt, iterations, keylen);  //암호화
    var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
    datas[2] = pw_cryp;
    datas[7] = salt;
    var image_path = ip+"profile_image.jpg";
    //이메일이 중복되는지 검사.
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var callback_data = {};
            callback_data.results = {"profile_num": -1}
            callback_data.message = "signup fail";
            callback_data.success = 1;
            callback(callback_data);
        } else {
            var sql = 'SELECT profile_email, profile_num FROM profile WHERE profile_email=?';
            conn.query(sql, datas[3], function (err, row1) {
                if (err) {
                    console.error('err', err);
                    var callback_data = {};
                    callback_data.results = {"profile_num": -1}
                    callback_data.message = "signup fail";
                    callback_data.success = 1;
                    conn.release();
                    callback(callback_data);
                } else {                    //select 후
                    if (row1.length == 0) {//없음.
                        datas.push(image_path);
                        var sql = 'INSERT INTO profile(profile_first_name, profile_last_name, profile_password, profile_email, profile_gender, location_num, profile_birth, profile_salt, profile_signup_time,profile_image_path) VALUES(?,?,?,?,?,?,?,?,now(),?)';
                        conn.query(sql, datas, function (err, row2) {
                            if (err) {
                                console.error("err", err);
                                var callback_data = {};
                                callback_data.results = {"profile_num": -1}
                                callback_data.message = "signup fail";
                                callback_data.success = 1;
                                conn.release();
                                callback(callback_data);
                            } else if (row2.affectedRows == 1) {
                                //성공, PROFILE_NUM을 얻는다.
                                conn.query('SELECT profile_num FROM profile WHERE profile_email=?', datas[3], function (err, row3) {
                                    if (err) {
                                        console.error('err', err);
                                        var callback_data = {};
                                        callback_data.results = {"profile_num": -1}
                                        callback_data.message = "signup fail";
                                        callback_data.success = 1;
                                        conn.release();
                                        callback(callback_data);
                                    } else {
                                        var sql = 'SELECT * FROM gcm WHERE gcm_token=?'
                                        conn.query(sql, gcm_data, function (err, gcm_row) {
                                            if (err) {
                                                console.error('err', err);
                                                var callback_data = {};
                                                callback_data.results = {"profile_num": -1}
                                                callback_data.message = "gcm fail";
                                                callback_data.success = 1;
                                                conn.release();
                                                callback(callback_data)
                                            } else if (gcm_row.length == 1) { // 있는거 update
                                                var sql = "UPDATE gcm SET profile_num=? WHERE gcm_token=?";
                                                conn.query(sql, [row3[0].profile_num, gcm_data], function (err, gcm_update) {
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "signup fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //업데이트 성공.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": row3[0].profile_num
                                                        };
                                                        callback_data.success = 1;
                                                        callback_data.message = "signup success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                })
                                            } else { //없는거 insert
                                                var sql = 'INSERT INTO gcm(profile_num, gcm_token) VALUES(?,?)';
                                                conn.query(sql, [row3[0].profile_num, gcm_data], function (err, row4) {
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "signup fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //성공과 프로필 넘버를 넘겨준다.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": row3[0].profile_num
                                                        };
                                                        callback_data.success = 1;
                                                        callback_data.message = "signup success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                })
                            } else {
                                //실패
                                var callback_data = {};
                                callback_data.results = {"profile_num": -1}
                                callback_data.message = "signup fail";
                                callback_data.success = 1;
                                conn.release();
                                callback(callback_data);
                            }
                        })
                    } else { //존재함.
                        var callback_data = {};
                        callback_data.results = {"profile_num": -1}
                        callback_data.message = "email exist";
                        callback_data.success = 1;
                        conn.release();
                        callback(callback_data);
                    }
                }
            });
        }
    });
};

//fb 회원 가입.
//미완성
exports.signup_fb = function (datas, gcm_data, callback) {
    /*      받아오는 형태
     datas
     { id: '766974706718539',
     email: 'snaos1@naver.com',
     first_name: '성환',!!!!!!!!!!!!!!!
     gender: 'male',
     last_name: '김',
     link: 'https://www.facebook.com/app_scoped_user_id/766974706718539/',
     locale: 'ko_KR',
     name: '김성환',
     timezone: 9,
     updated_time: '2014-10-19T15:05:12+0000',
     verified: true ,
     image: url
     }
     */


    if (datas.gender == 'male') {
        datas.gender = 'M';
    } else {
        datas.gender = 'F';
    }
    //var date = datas.birth.split('/');
    //date = date[2] + '-' + date[0] + '-' + date[1];
    var date = '0000-00-00';
    var image_path = './public/uploads/profile/' + datas.id + '_' + Date.now() + '.jpg';
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.success = 1;
            results.message = "fb signup fail";
            callback(results);
        } else {
            var sql = 'SELECT profile_facebook_id FROM profile WHERE profile_facebook_id=?';
            conn.query(sql, [datas.id], function (err, row) {
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.success = 1;
                    results.message = "fb signup fail";
                    conn.release();
                    callback(results);
                } else if (row.length == 0) {        //가입한 적 없음
                    download(datas.image, image_path, function () {//이미지를 받아옴
                        var insert_datas = [datas.first_name, datas.last_name, 'fb_' + Date.now(), datas.gender, '1', date, datas.id, ip + image_path.substring(9)];
                        console.log('insert_datas', insert_datas);
                        var sql = 'INSERT INTO profile(profile_first_name, profile_last_name, profile_email, ' +
                            'profile_gender, location_num, profile_birth, profile_facebook_id, ' +
                            ' profile_signup_time,profile_image_path) VALUES(?,?,?,?,?,?,?,now(),?)';
                        conn.query(sql, insert_datas, function (err, row1) { //회원가입
                            if (row1.affectedRows == 1) {          //성공
                                var sql = 'SELECT profile_num FROM profile WHERE profile_facebook_id=?';
                                conn.query(sql, datas.id, function (err, rows) {
                                    if (rows.length == 1) {        //불러오기 성공
                                        var sql = 'SELECT * FROM gcm WHERE gcm_token=?'
                                        conn.query(sql, gcm_data, function (err, gcm_row) {
                                            if (err) {
                                                console.error('err', err);
                                                var callback_data = {};
                                                callback_data.results = {"profile_num": -1}
                                                callback_data.message = "gcm fail";
                                                callback_data.success = 1;
                                                conn.release();
                                                callback(callback_data)
                                            } else if (gcm_row.length == 1) { // 있는거 update
                                                var sql = "UPDATE gcm SET profile_num=? WHERE gcm_token=?";
                                                conn.query(sql, [rows[0].profile_num, gcm_data], function (err, gcm_update) {
                                                    console.log('gcm_update', gcm_update);
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "fb signup fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //업데이트 성공.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": rows[0].profile_num
                                                        };
                                                        callback_data.success = 1;
                                                        callback_data.message = "fb signup success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                })
                                            } else { //없는거 insert
                                                var sql = 'INSERT INTO gcm(profile_num, gcm_token) VALUES(?,?)';
                                                conn.query(sql, [rows[0].profile_num, gcm_data], function (err, row4) {
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "fb signup fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //성공과 프로필 넘버를 넘겨준다.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": rows[0].profile_num
                                                        };
                                                        callback_data.success = 1;
                                                        callback_data.message = "fb signup success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                });
                                            }
                                        });
                                    } else {                     //불러오기 실패
                                        console.error('err', err);
                                        var results = {};
                                        results.success = 1;
                                        results.message = "fb signup success, select fail";
                                        conn.release();
                                        callback(results);
                                    }
                                })
                            } else {        //insert 실패
                                console.error('err', err);
                                var results = {};
                                results.success = 1;
                                results.message = "fb signup fail";
                                conn.release();
                                callback(results);
                            }
                        });
                    });     //end download
                } else {                            //가입을 이미 함 -> 로그인
                    var sql = 'SELECT profile_num FROM profile WHERE profile_facebook_id=?';
                    conn.query(sql, [datas.id], function (err, row) {
                        if (err) {             //로그인 실패
                            console.error('err', err);
                            var results = {};
                            results.message = "fb login fail";
                            results.success = 1;
                            results.results = {
                                "profile_num": -1
                            }
                            conn.release();
                            callback(results);
                        } else if (row.length == 1) {          //로그인 불러오기 성공
                            var sql = 'SELECT * FROM gcm WHERE gcm_token=?'
                            conn.query(sql, gcm_data, function (err, gcm_row) {
                                if (err) {
                                    console.error('err', err);
                                    var callback_data = {};
                                    callback_data.results = {"profile_num": -1}
                                    callback_data.message = "gcm fail";
                                    callback_data.success = 1;
                                    conn.release();
                                    callback(callback_data)
                                } else if (gcm_row.length == 1) { // 있는거 update
                                    var sql = "UPDATE gcm SET profile_num=? WHERE gcm_token=?";
                                    conn.query(sql, [row[0].profile_num, gcm_data], function (err, gcm_update) {
                                        if (err) {
                                            console.error('err', err);
                                            var callback_data = {};
                                            callback_data.results = {"profile_num": -1}
                                            callback_data.message = "fb login fail";
                                            callback_data.success = 1;
                                            conn.release();
                                            callback(callback_data);
                                        } else { //업데이트 성공.
                                            var callback_data = {};
                                            callback_data.results = {
                                                "profile_num": row[0].profile_num
                                            };
                                            callback_data.success = 1;
                                            callback_data.message = "fb login success";
                                            conn.release();
                                            callback(callback_data);
                                        }
                                    })
                                } else { //없는거 insert
                                    var sql = 'INSERT INTO gcm(profile_num, gcm_token) VALUES(?,?)';
                                    conn.query(sql, [row[0].profile_num, gcm_data], function (err, row4) {
                                        if (err) {
                                            console.error('err', err);
                                            var callback_data = {};
                                            callback_data.results = {"profile_num": -1}
                                            callback_data.message = "fb login fail";
                                            callback_data.success = 1;
                                            conn.release();
                                            callback(callback_data);
                                        } else { //성공과 프로필 넘버를 넘겨준다.
                                            var callback_data = {};
                                            callback_data.results = {
                                                "profile_num": row[0].profile_num
                                            };
                                            callback_data.success = 1;
                                            callback_data.message = "fb login success";
                                            conn.release();
                                            callback(callback_data);
                                        }
                                    });
                                }
                            });
                        } else {                    //로그인 실패
                            var results = {};
                            results.message = "fb login fail";
                            results.success = 1;
                            results.results = {
                                "profile_num": -1
                            }
                            conn.release();
                            callback(results);
                        }
                    });
                }
            })
        }
    });
}


//로그인 하기 datas에 email, pw가 배열로
exports.login = function (datas, gcm_data, callback) {
    var email = datas[0];
    var pw = datas[1] + "";
    pool.getConnection(function (err, conn) {           //존재성 확인과 salt값 가져온다.
        if (err) {
            console.error('err', err);
            var callback_data = {};
            callback_data.message = "login fail";
            callback_data.results = {
                "profile_num": -1
            };
            callback_data.success = 1;
            callback(callback_data)
        } else {
            var sql = 'SELECT profile_num, profile_salt, profile_google_id, profile_facebook_id FROM profile WHERE profile_email=?';
            conn.query(sql, email, function (err, row1) {
                if (row1.length == 1) {                                             //이메일이 존재하면
                    if (!(row1[0].profile_google_id || row1[0].profile_facebook_id)) {       //구글과 페이스북이 아니면
                        var salt = row1[0].profile_salt;
                        var key = crypto.pbkdf2Sync(pw, salt, iterations, keylen);          //암호화
                        var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
                        pool.getConnection(function (err, conn) {
                            if (err) console.error('err', err);
                            var sql = 'SELECT profile_num FROM profile WHERE profile_email=? AND profile_password=?';
                            conn.query(sql, [email, pw_cryp], function (err, row) {                     //이메일과 비밀번호 확인
                                if (err) {
                                    console.error('err', err);
                                    var callback_data = {};
                                    callback_data.message = "login fail";
                                    callback_data.success = 1;
                                    callback_data.results = {
                                        "profile_num": -1
                                    };
                                    conn.release();
                                    callback(callback_data)
                                } else {
                                    if (row.length == 1) {          //로그인 성공
                                        var sql = 'SELECT * FROM gcm WHERE gcm_token=?'
                                        conn.query(sql, gcm_data, function (err, gcm_row) {
                                            if (err) {
                                                console.error('err', err);
                                                var callback_data = {};
                                                callback_data.results = {"profile_num": -1}
                                                callback_data.message = "gcm fail";
                                                callback_data.success = 1;
                                                conn.release();
                                                callback(callback_data)
                                            } else if (gcm_row.length == 1) { // 있는거 update
                                                var sql = "UPDATE gcm SET profile_num=? WHERE gcm_token=?";
                                                conn.query(sql, [row[0].profile_num, gcm_data], function (err, gcm_update) {
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "login fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //업데이트 성공.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": row[0].profile_num
                                                        };
                                                        console.log('callback_data');
                                                        callback_data.success = 1;
                                                        callback_data.message = "login success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                })
                                            } else { //없는거 insert
                                                var sql = 'INSERT INTO gcm(profile_num, gcm_token) VALUES(?,?)';
                                                conn.query(sql, [row[0].profile_num, gcm_data], function (err, row4) {
                                                    if (err) {
                                                        console.error('err', err);
                                                        var callback_data = {};
                                                        callback_data.results = {"profile_num": -1}
                                                        callback_data.message = "signup fail";
                                                        callback_data.success = 1;
                                                        conn.release();
                                                        callback(callback_data);
                                                    } else { //성공과 프로필 넘버를 넘겨준다.
                                                        var callback_data = {};
                                                        callback_data.results = {
                                                            "profile_num": row3[0].profile_num
                                                        };
                                                        callback_data.success = 1;
                                                        callback_data.message = "signup success";
                                                        conn.release();
                                                        callback(callback_data);
                                                    }
                                                });
                                            }
                                        });
                                    } else {            //비밀번호를 틀릴 경우
                                        callback_data = {};
                                        callback_data.success = 1;
                                        callback_data.message = "check password"
                                        callback_data.results = {
                                            "profile_num": -1
                                        };
                                        conn.release();
                                        callback(callback_data);
                                    }
                                }
                            })
                        })
                    } else {
                        var callback_data = {};
                        callback_data.success = 1;
                        callback_data.message = "not a email user";
                        callback_data.results = {
                            "profile_num": ""
                        };
                        conn.release();
                        callback(callback_data);
                    }
                }
                else {              //이메일이 없을 경우
                    var callback_data = {};
                    callback_data.success = 1;
                    callback_data.message = "email not exist";
                    callback_data.results = {
                        "profile_num": ""
                    };
                    conn.release();
                    callback(callback_data);
                }
            });
        }
    })
};

//프로필 수정 페이지에 뿌려줄 데이터를 보여준다,
//data = user_num
exports.edit_profile = function (data, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "profile load fail";
            results.success = 1;
            callback(results);
        }
        else {
            var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?'
            conn.query(sql, data, function (err, row) {
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.message = "profile load fail";
                    results.success = 1;
                    conn.release();
                    callback(results);
                }
                else if (row.length == 1) {     //성공
                    var callback_data = {};
                    callback_data.results = row[0];
                    callback_data.success = 1;
                    callback_data.message = "profile load success";
                    conn.release();
                    callback(callback_data);
                } else {                        //실패
                    var results = {};
                    results.message = "profile load fail";
                    results.success = 1;
                    conn.release();
                    callback(results);
                }
            });
        }
    });
};

//edit_profile에서 sava버튼을 누르면 db에 정보를 업데이트 한다.
//var datas = [first, last, intro, url, image, user_num];
exports.edit_profile_save = function (datas, url, callback) {
    var empty = {
        "results": [
            {
                "profile_num": -1,
                "profile_image_path": "",
                "profile_first_name": "",
                "profile_last_name": "",
                "profile_introduction": "",
                "profile_url": ""
            }
        ],
        "success": 1,
        "message": "profile edit fail"
    }
    var image = datas[4];
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            callback(empty);
        } else {
            console.log('어디서 도대체 에러니?');
            if (url) {
                var sql = 'UPDATE profile SET profile_first_name=?, profile_last_name=?, profile_introduction=?, profile_url=?, profile_image_path=? WHERE profile_num=?';
                conn.query(sql, datas, function (err, row) {                //updqte 시도
                    if (err) {
                        console.error('err', err);
                        conn.release();
                        callback(empty);
                    } else {
                        if (row.affectedRows == 1) {                    //updqte 성공 후 데이터 불러오기
                            var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?';
                            console.log('datas', datas);
                            conn.query(sql, datas[5], function (err, row) {
                                if (err) {
                                    console.error('err', err);
                                    conn.release();
                                    callback(empty);
                                } else if (row.length == 1) {   //성공
                                    var callback_data = {};
                                    callback_data.results = row[0];
                                    callback_data.success = 1;
                                    callback_data.message = "profile edit success";
                                    conn.release();
                                    callback(callback_data);
                                } else {
                                    conn.release();
                                    callback(empty);
                                }
                            });
                        } else {
                            conn.release();
                            callback(empty);
                        }
                    }
                });
            } else {
                if (image) {
                    fs.copy(image.path, 'public/uploads/profile/' + image.name, function (err) {        //이미지 경로 변경을 위한 복사
                        if (err) {
                            console.error('err', err);
                            callback(empty);
                        } else {
                            datas[4] = ip + 'uploads/profile/' + image.name;              //db에 저장할 경로 수정
                            pool.getConnection(function (err, conn) {
                                if (err) {
                                    console.error('err', err);
                                    callback(empty)
                                } else {
                                    var sql = 'SELECT profile_image_path FROM profile WHERE profile_num=?';     //원래 저장된 경로 불러오기
                                    conn.query(sql, datas[5], function (err, row1) {
                                        if (err) {
                                            console.error('err', err);
                                            conn.release();
                                            callback(empty);
                                        } else {
                                            fs.remove(image.path, function (err) {                              //원래 경로 프로필 삭제
                                                if (err) {
                                                    console.error('err', err);
                                                    conn.release();
                                                    callback(empty);
                                                } else {
                                                    image = row1[0].profile_image_path;
                                                    if (image) {                                                //이전에 이미지가 있다면
                                                        fs.remove('public/' + image.substring(ip.length), function (err) {
                                                            if (err) {
                                                                console.error('err', err);
                                                                callback(empty);
                                                            } else {
                                                                var sql = 'UPDATE profile SET profile_first_name=?, profile_last_name=?, profile_introduction=?, profile_url=?, profile_image_path=? WHERE profile_num=?';
                                                                conn.query(sql, datas, function (err, row) {                //updqte 시도
                                                                    if (err) {
                                                                        console.error('err', err);
                                                                        conn.release();
                                                                        callback(empty);
                                                                    } else {
                                                                        if (row.affectedRows == 1) {                    //updqte 성공 후 데이터 불러오기
                                                                            var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?';
                                                                            conn.query(sql, datas[5], function (err, row) {
                                                                                if (err) {
                                                                                    console.error('err', err);
                                                                                    conn.release();
                                                                                    callback(empty);

                                                                                } else if (row.length == 1) {   //성공
                                                                                    var callback_data = {};
                                                                                    callback_data.results = row[0];
                                                                                    callback_data.success = 1;
                                                                                    callback_data.message = "profile edit success";
                                                                                    conn.release();
                                                                                    callback(callback_data);
                                                                                } else {
                                                                                    conn.release();
                                                                                    callback(empty);
                                                                                }
                                                                            });
                                                                        } else {
                                                                            conn.release();
                                                                            callback(empty);
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        })
                                                    } else {                                    //이 전에 이미지가 없다면 삭제 없이 업데이트
                                                        var sql = 'UPDATE profile SET profile_first_name=?, profile_last_name=?, profile_introduction=?, profile_url=?, profile_image_path=? WHERE profile_num=?';
                                                        conn.query(sql, datas, function (err, row) {
                                                            if (err) {
                                                                console.error('err', err);
                                                                conn.release();
                                                                callback(empty);
                                                            } else {
                                                                if (row.affectedRows == 1) {
                                                                    var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?';
                                                                    conn.query(sql, datas[5], function (err, row) {             //업데이트 결과 불러오기
                                                                        if (err) {
                                                                            console.error('err', err);
                                                                            conn.release();
                                                                            callback(empty);
                                                                        } else if (row.length == 1) {   //성공
                                                                            var callback_data = {};
                                                                            callback_data.results = row;
                                                                            callback_data.success = 1;
                                                                            callback_data.message = "profile edit success";
                                                                            conn.release();
                                                                            callback(callback_data);
                                                                        } else {
                                                                            console.error('err', err);
                                                                            conn.release();
                                                                            callback(empty);
                                                                        }
                                                                    });
                                                                } else {
                                                                    console.error('err', err);
                                                                    conn.release();
                                                                    callback(empty);
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    pool.getConnection(function (err, conn) {
                        if (err) {
                            console.error('err', err);
                            conn.release();
                            callback(empty)
                        } else {
                            var sql = 'SELECT profile_image_path FROM profile WHERE profile_num=?';     //원래 저장된 경로 불러오기
                            conn.query(sql, datas[5], function (err, row1) {
                                if (err) {
                                    console.error('err', err);
                                    conn.release();
                                    callback(empty)
                                } else {
                                    image = row1[0].profile_image_path;
                                    if (image) {                                               //이전에 이미지가 있다면
                                        fs.remove('public/' + image.substring(ip.length), function (err) {
                                            if (err) {
                                                console.error('err', err);
                                                conn.release();
                                                callback(empty)
                                            } else {
                                                var sql = 'UPDATE profile SET profile_first_name=?, profile_last_name=?, profile_introduction=?, profile_url=?, profile_image_path=? WHERE profile_num=?';
                                                conn.query(sql, datas, function (err, row) {                //updqte 시도
                                                    if (err) {
                                                        console.error('err', err);
                                                        conn.release();
                                                        callback(empty)
                                                    } else {

                                                        if (row.affectedRows == 1) {                    //updqte 성공 후 데이터 불러오기
                                                            var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?';
                                                            conn.query(sql, datas[5], function (err, row) {
                                                                if (err) {
                                                                    console.error('err', err);
                                                                    conn.release();
                                                                    callback(empty)
                                                                } else if (row.length == 1) {   //성공
                                                                    var callback_data = {};
                                                                    callback_data.results = row;
                                                                    callback_data.success = 1;
                                                                    callback_data.message = "profile edit success";
                                                                    conn.release();
                                                                    callback(callback_data);
                                                                } else {
                                                                    conn.release();
                                                                    callback(empty);
                                                                }
                                                            });
                                                        } else {
                                                            console.error('err', err);
                                                            conn.release();
                                                            callback(empty);
                                                        }
                                                    }
                                                });
                                            }
                                        })
                                    } else {                                    //이 전에 이미지가 없다면 삭제 없이 업데이트
                                        var sql = 'UPDATE profile SET profile_first_name=?, profile_last_name=?, profile_introduction=?, profile_url=?, profile_image_path=? WHERE profile_num=?';
                                        conn.query(sql, datas, function (err, row) {
                                            if (err) {
                                                console.error('err', err);
                                                conn.release();
                                                callback(empty);
                                            } else {
                                                if (row.affectedRows == 1) {
                                                    var sql = 'SELECT profile_num, profile_image_path, profile_first_name, profile_last_name, profile_introduction, profile_url FROM profile WHERE profile_num=?';
                                                    conn.query(sql, datas[5], function (err, row) {             //업데이트 결과 불러오기
                                                        if (err) {
                                                            console.error('err', err);
                                                            conn.release();
                                                            callback(empty);
                                                        } else if (row.length == 1) {   //성공
                                                            var callback_data = {};
                                                            callback_data.results = row;
                                                            callback_data.success = 1;
                                                            callback_data.message = "profile edit success";
                                                            conn.release();
                                                            callback(callback_data);
                                                        } else {
                                                            console.error('err', err);
                                                            conn.release();
                                                            callback(empty);
                                                        }
                                                    });
                                                } else {
                                                    console.error('err', err);
                                                    conn.release();
                                                    callback(empty);
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        }
    })
}

exports.account = function (datas, callback) {
    var empty = {
        "message": "account settings load fail",
        "success": 1,
        "results": {
            "profile_email": "",
            "profile_birth": "",
            "profile_gender": "",
            "location_name": ""
        }
    }
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            callback(empty)
        }
        else {
            var sql = "SELECT profile_email, DATE_FORMAT(profile_birth,'%Y-%m-%d') profile_birth, profile_gender, location_num FROM profile WHERE profile_num=?";
            conn.query(sql, datas, function (err, row) {                    //데이터 불러오기
                if (err) {
                    console.error('err', err);
                    conn.release();
                    callback(empty);
                } else if (row.length == 1) {           //select 성공
                    var sql = "SELECT location_name FROM location WHERE location_num=?";
                    conn.query(sql, row[0].location_num, function (err, location_row) {

                        var callback_data = {};
                        callback_data.results = row[0];
                        callback_data.results.location_name = location_row[0].location_name;
                        callback_data.success = 1;
                        callback_data.message = "account settings load success";
                        conn.release();
                        callback(callback_data);
                    })
                } else {                             //select에 문제가 있음
                    conn.release();
                    callback(empty);
                }
            });
        }
    });
};


//account settings에서 이메일을 설정한다.
//datas = [user_num, edit_email, pw]
exports.account_email = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.success = 1;
            results.message = "email edit fail";
            results.results = {"profile_num": -1}
            callback(results)
        }
        else {              //비밀번호 확인을 위해서 salt를 불러온다.
            var sql = 'SELECT profile_salt FROM profile WHERE profile_num=?'
            conn.query(sql, datas[0], function (err, row1) {
                if (row1.length == 1) {                                             //salt찾음
                    var salt = row1[0].profile_salt;
                    var key = crypto.pbkdf2Sync(datas[2] + "", salt + "", iterations, keylen);  //암호화
                    var pw_cryp = Buffer(key, 'binary').toString('hex');                //암호화된 값 생성.
                    //비밀번호 확인
                    var sql = 'SELECT profile_email FROM profile WHERE profile_password=? AND profile_num=?';
                    conn.query(sql, [pw_cryp, datas[0]], function (err, row2) {
                        if (err) {
                            console.error('err', err);
                            var results = {};
                            results.message = "edit email fail";
                            results.success = 1;
                            results.results = {"profile_num": -1}
                            conn.release();
                            callback(results)
                        } else if (row2.length == 1) {              //해당 유저의 비밀번호가 맞으면 업데이트
                            var sql = 'UPDATE profile SET profile_email=? WHERE profile_num=?';
                            conn.query(sql, [datas[1], datas[0]], function (err, row3) {
                                if(err){
                                   var results = {
                                                                           "message": "email exist",
                                                                           "success": 1
                                    };
                                                                       results.results = {"profile_num": -1}
                                                                       conn.release();
                                                                       callback(results);
                                }
                                else if (row3.affectedRows == 1) {       //업데이트 성공시
                                    var results = {
                                        "success": 1,
                                        "message": "email edit success"
                                    };
                                    results.results = {"profile_num": datas[0]};
                                    conn.release();
                                    callback(results);
                                } else {                        //이메일이 존재할 경우
                                    var results = {
                                        "message": "email exist",
                                        "success": 1
                                    };
                                    results.results = {"profile_num": -1}
                                    conn.release();
                                    callback(results);
                                }
                            });
                        } else {                //비밀번호 틀릴 경우
                            var results = {
                                "message": "check password",
                                "success": 1
                            };
                            results.results = {"profile_num": -1}
                            conn.release();
                            callback(results);
                        }
                    })
                } else {
                    var results = {
                        "message": "email edit fail",
                        "success": 1
                    };
                    results.results = {"profile_num": -1}
                    conn.release();
                    callback(results);
                }
            });
        }
    });
};

//비밀번호 설정
//datas = [user_num, original_pw, edit_pw];
exports.edit_pw = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.success = 1;
            results.message = "password edit fail";
            callback(results)
        }
        else {
            var sql = 'SELECT profile_salt,profile_password FROM profile WHERE profile_num=?';
            conn.query(sql, datas[0], function (err, row1) {
                if (err) {        //err
                    console.error('err', err);
                    var results = {};
                    results.message = "password edit fail";
                    results.success = 1;
                    conn.release();
                    callback(results)
                } else {
                    if (row1.length == 1) {    //행 하나를 찾게 되면
                        var salt = row1[0].profile_salt;
                        var key = crypto.pbkdf2Sync(datas[1], salt, iterations, keylen);  //암호화
                        var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
                        if (row1[0].profile_password == pw_cryp) {                  //비밀번호가 맞으면
                            var new_key = crypto.pbkdf2Sync(datas[2], salt, iterations, keylen);  //암호화
                            var new_pw_cryp = Buffer(new_key, 'binary').toString('hex');     //암호화된 값 생성.
                            var sql = 'UPDATE profile SET profile_password=? where profile_num=?';
                            conn.query(sql, [new_pw_cryp, datas[0]], function (err, row2) {
                                if (err) {                              //err
                                    console.error('err', err);
                                    var results = {};
                                    results.message = "password edit fail";
                                    results.success = 1;
                                    conn.release();
                                    callback(results)
                                } else {
                                    if (row2.affectedRows == 1) {      //제대로 되면
                                        var results = {};
                                        results.success = 1;
                                        results.message = "password edit success";
                                        conn.release();
                                        callback(results);
                                    } else {
                                        var results = {};
                                        results.message = "password edit fail";
                                        results.success = 1;
                                        conn.release();
                                        callback(results);
                                    }
                                }
                            })
                        } else { //비밀번호가 틀리면
                            var results = {};
                            results.message = "check password";
                            results.success = 1;
                            conn.release();
                            callback(results)
                        }
                    } else { //행 하나를 못 찾으면
                        var results = {};
                        results.message = "password edit fail";
                        results.success = 1;
                        conn.release();
                        callback(results)
                    }
                }

            });
        }

    });
}

exports.account_edit = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "account edit fail";
            results.success = 1;
            callback(results)
        } else {
            var sql = 'UPDATE profile SET profile_birth=?, profile_gender=?, location_num=? WHERE profile_num=?'
            conn.query(sql, datas, function (err, row) {
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.success = 1;
                    results.message = "account edit fail";
                    conn.release();
                    callback(results);
                } else if (row.affectedRows == 1) {
                    var callback_results = {};
                    callback_results.success = 1;
                    callback_results.message = "account edit success";
                    conn.release();
                    callback(callback_results);
                } else {
                    var results = {};
                    results.success = 1;
                    results.message = "account edit fail";
                    conn.release();
                    callback(results);
                }
            })
        }
    })
}

//생년월일 설정
//datas = [user_num, birth]
exports.edit_birth = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "birth edit fail";
            results.success = 1;
            callback(results)
        } else {                 //연결 되면
            var sql = 'UPDATE profile SET profile_birth=? WHERE profile_num=?';
            conn.query(sql, [datas[1], datas[0]], function (err, row) { //생년월일 업데이트
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.success = 1;
                    results.message = "birth edit fail";
                    conn.release();
                    callback(results)
                } else {
                    if (row.affectedRows == 1) {
                        var results = {
                            "success": 1,
                            "message": "birth edit success"
                        };
                        conn.release();
                        callback(results);
                    } else {
                        var results = {};
                        results.success = 1;
                        results.message = "birth edit fail";
                        conn.release();
                        callback(results);
                    }
                }
            });
        }
    });
}

//성별 설정
// datas = [user_num, gender];
exports.edit_gender = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "gender edit fail";
            results.success = 1;
            callback(results)
        } else {                 //연결 되면
            var sql = 'UPDATE profile SET profile_gender=? WHERE profile_num=?';
            conn.query(sql, [datas[1], datas[0]], function (err, row) { //생년월일 업데이트
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.message = "gender edit fail";
                    results.success = 1;
                    conn.release();
                    callback(results)
                } else {
                    if (row.affectedRows == 1) {
                        var results = {
                            "success": 1,
                            "message": "gender edit success"
                        };
                        conn.release();
                        callback(results);
                    } else {
                        var results = {};
                        results.message = "gender edit fail";
                        results.success = 1;
                        conn.release();
                        callback(results);
                    }
                }
            });
        }
    });
}

//국가 설정
//datas = [user_num, location];
exports.edit_location = function (datas, callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error('err', err);
            var results = {};
            results.message = "location edit fail";
            results.success = 1;
            callback(results)
        } else {                 //연결 되면
            var sql = 'UPDATE profile SET location_num=? WHERE profile_num=?';
            conn.query(sql, [datas[1], datas[0]], function (err, row) { //생년월일 업데이트
                if (err) {
                    console.error('err', err);
                    var results = {};
                    results.message = "location edit fail";
                    results.success = 1;
                    conn.release();
                    callback(results)
                } else {
                    if (row.affectedRows == 1) {
                        var results = {
                            "success": 1,
                            "message": "location edit success"
                        };
                        conn.release();
                        callback(results);
                    } else {
                        var results = {};
                        results.message = "location edit fail";
                        results.success = 1;
                        conn.release();
                        callback(results);
                    }
                }
            });
        }
    });
}

//datas = [ user_num,keyword ]
exports.search_user = function (datas, callback) {
    var page_size = 20;
    if (datas[1].length > 1) {
        var first_name = datas[1].substring(1);       //성과 이름일 경우 성 빼고 검색
        var last_name = datas[1].substring(0, 1);

    } else {
        var first_name = datas[1];       //성과 이름일 경우 성 빼고 검색
        var last_name = datas[1];
    }
    var english_name = datas[1].split(' ');

    if (english_name.length == 1) {
        pool.getConnection(function (err, conn) {
            var sql = 'select (select 1 FROM follow as f where exists' +
                '(select profile_num_get from follow where search_user.profile_num=f.profile_num_get and f.profile_num_do=?)) ' +
                'as follow_status, (select  count(*) from profile p, recommend r, ' +
                'review where review.review_num=r.review_num and review.profile_num=p.profile_num ' +
                'and search_user.profile_num=p.profile_num) as all_recommend_num, search_user.profile_num as profile_num,' +
                ' search_user.profile_first_name as profile_first_name, search_user.profile_last_name as profile_last_name,search_user.profile_image_path, ' +
                '(select count(*) cnt from review, profile p where review.review_delete = "N" and review.profile_num=p.profile_num and search_user.profile_num=p.profile_num) as all_review_number from ' +
                '(select p.profile_num AS profile_num, p.profile_first_name AS profile_first_name, p.profile_last_name AS profile_last_name, ' +
                'p.profile_image_path AS profile_image_path from profile p where p.profile_first_name ' +
                'like ? OR p.profile_last_name like ? OR p.profile_last_name like ? OR p.profile_first_name like ?) AS search_user';

            conn.query(sql, [datas[0], datas[1] + '%', datas[1] + '%', datas[0], first_name + "%", last_name + "%"], function (err, rows) {
                if (err) {    //에러
                    var callback_results = {};
                    callback_results.success = 1;
                    callback_results.message = "search user fail";
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
                    conn.release();
                    callback(callback_results);
                } else if (rows.length == 0) { //검색 결과가 없음
                    var callback_results = {};
                    callback_results.success = 1;
                    callback_results.message = "no search user";
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
                    conn.release();
                    callback(callback_results);
                } else {         //검색 결과가 있음
                    var callback_results = {};
                    var page = datas[2];
                    var cnt = rows.length;
                    var totalPage = Math.ceil(cnt / page_size);
                    var start_num = (page - 1) * page_size;
                    var end_num = (page * page_size) - 1;
                    callback_results.results = [];
                    if (page == 1 && totalPage > 0) {
                        for (var i = 0; (i < page_size) && i < cnt; i++) {
                            if (!rows[i].follow_status) {
                                rows[i].follow_status = 0;
                            }
                            callback_results.results[i] = rows[i];
                        }
                        callback_results.message = "search user success";
                    } else if (page > totalPage) {
                        callback_results.message = "page is over";
                        callback_results.results = [];
                        callback_results.results[0] =
                        {
                            "profile_num": -1,
                            "profile_first_name": "",
                            "profile_last_name": "",
                            "profile_image_path": "",
                            "all_review_number": -1,
                            "all_recommend_num": -1,
                            "follow_status": -1
                        };
                    } else {
                        if (end_num > cnt) {
                            end_num = cnt;
                        }       //마지막 리뷰 숫자가 최대 숫자보다 크면 최대 숫자로
                        for (var i = 0; i < end_num - start_num + 1; i++) {

                            if (!rows[start_num + i].follow_status) {
                                rows[start_num + i].follow_status = 0;
                            }
                            callback_results.results[i] = rows[start_num + i];
                        }
                        callback_results.message = "search user success";
                    }
                    callback_results.success = 1;
                    conn.release();
                    callback(callback_results);
                }
            });
        });
    } else {     //영어 이름일 경우(띄어 쓰기를 할 경우)
        pool.getConnection(function (err, conn) {
            var sql = 'select (select 1 FROM follow as f where exists' +
                '(select profile_num_get from follow where search_user.profile_num=f.profile_num_get and f.profile_num_do=?)) ' +
                'as follow_status, (select  count(*) from profile p, recommend r, ' +
                'review where review.review_num=r.review_num and review.profile_num=p.profile_num ' +
                'and search_user.profile_num=p.profile_num) as all_recommend_num, search_user.profile_num as profile_num,' +
                ' search_user.profile_first_name as profile_first_name, search_user.profile_last_name as profile_last_name,search_user.profile_image_path, ' +
                '(select count(*) cnt from review, profile p where review.profile_num=p.profile_num and search_user.profile_num=p.profile_num) as all_review_number from ' +
                '(select p.profile_num AS profile_num, p.profile_first_name AS profile_first_name, p.profile_last_name AS profile_last_name, ' +
                'p.profile_image_path AS profile_image_path from profile p where p.profile_first_name ' +
                'like ? OR p.profile_last_name like ?  OR p.profile_last_name like ? OR p.profile_first_name like ? ' +
                ' OR p.profile_last_name like ? OR p.profile_first_name like ?) AS search_user';

            conn.query(sql, [datas[0], datas[1] + '%', datas[1] + '%', datas[0], english_name[0] + "%", english_name[0] + "%", english_name[1] + "%", english_name[1] + "%"], function (err, rows) {
                if (err) {    //에러
                    var callback_results = {};
                    callback_results.success = 1;
                    callback_results.message = "search user fail";
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
                    conn.release();
                    callback(callback_results);
                } else if (rows.length == 0) { //검색 결과가 없음
                    var callback_results = {};
                    callback_results.success = 1;
                    callback_results.message = "no search user";
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
                    conn.release();
                    callback(callback_results);
                } else {         //검색 결과가 있음
                    var callback_results = {};
                    var page = datas[2];
                    var cnt = rows.length;
                    var totalPage = Math.ceil(cnt / page_size);
                    var start_num = (page - 1) * page_size;
                    var end_num = (page * page_size) - 1;
                    callback_results.results = [];
                    if (page == 1 && totalPage > 0) {
                        for (var i = 0; (i < page_size) && i < cnt; i++) {
                            if (!rows[i].follow_status) {
                                rows[i].follow_status = 0;
                            }
                            callback_results.results[i] = rows[i];
                        }
                        callback_results.message = "search user success";
                    } else if (page > totalPage) {
                        callback_results.message = "page is over";
                        callback_results.results = [];
                        callback_results.results[0] =
                        {
                            "profile_num": -1,
                            "profile_first_name": "",
                            "profile_last_name": "",
                            "profile_image_path": "",
                            "all_review_number": -1,
                            "all_recommend_num": -1,
                            "follow_status": -1
                        };
                    } else {
                        if (end_num > cnt) {
                            end_num = cnt;
                        }       //마지막 리뷰 숫자가 최대 숫자보다 크면 최대 숫자로
                        for (var i = 0; i < end_num - start_num + 1; i++) {

                            if (!rows[start_num + i].follow_status) {
                                rows[start_num + i].follow_status = 0;
                            }
                            callback_results.results[i] = rows[start_num + i];
                        }
                        callback_results.message = "search user success";
                    }
                    callback_results.success = 1;
                    conn.release();
                    callback(callback_results);
                }
            });
        });
    }
}


//로그인 하기 datas에 email, pw가 배열로
exports.login_in_page = function (datas, callback) {
    var email = datas[0];
    var pw = datas[1] + "";
    pool.getConnection(function (err, conn) {           //존재성 확인과 salt값 가져온다.
        if (err) {
            console.error('err', err);
            var callback_data = {};
            callback_data.message = "login fail";
            callback_data.results = {
                "profile_num": -1
            };
            callback_data.success = 1;
            callback(callback_data)
        } else {
            var sql = 'SELECT profile_num, profile_salt, profile_google_id, profile_facebook_id FROM profile WHERE profile_email=?';
            conn.query(sql, email, function (err, row1) {
                if (row1.length == 1) {                                             //이메일이 존재하면
                    if (!(row1[0].profile_google_id || row1[0].profile_facebook_id)) {       //구글과 페이스북이 아니면
                        var salt = row1[0].profile_salt;
                        var key = crypto.pbkdf2Sync(pw, salt, iterations, keylen);          //암호화
                        var pw_cryp = Buffer(key, 'binary').toString('hex');     //암호화된 값 생성.
                        pool.getConnection(function (err, conn) {
                            if (err) console.error('err', err);
                            var sql = 'SELECT profile_num FROM profile WHERE profile_email=? AND profile_password=?';
                            conn.query(sql, [email, pw_cryp], function (err, row) {                     //이메일과 비밀번호 확인
                                if (err) {
                                    console.error('err', err);
                                    var callback_data = {};
                                    callback_data.message = "login fail";
                                    callback_data.success = 1;
                                    callback_data.results = {
                                        "profile_num": -1
                                    };
                                    conn.release();
                                    callback(callback_data)
                                } else {
                                    if (row.length == 1) {          //로그인 성공
                                        var callback_data = {};
                                        callback_data.results = {
                                            "profile_num": row[0].profile_num
                                        };
                                        console.log('callback_data');
                                        callback_data.success = 1;
                                        callback_data.message = "login success";
                                        conn.release();
                                        callback(callback_data);
                                    } else {
                                        var callback_data = {};
                                        callback_data.results = {
                                            "profile_num": -1
                                        };
                                        console.log('callback_data');
                                        callback_data.success = 1;
                                        callback_data.message = "login fail";
                                        conn.release();
                                        callback(callback_data);
                                    }
                                }
                            })
                        })
                    } else {
                        var callback_data = {};
                        callback_data.success = 1;
                        callback_data.message = "not a email user";
                        callback_data.results = {
                            "profile_num": ""
                        };
                        conn.release();
                        callback(callback_data);
                    }
                }
                else {              //이메일이 없을 경우
                    var callback_data = {};
                    callback_data.success = 1;
                    callback_data.message = "email not exist";
                    callback_data.results = {
                        "profile_num": ""
                    };
                    conn.release();
                    callback(callback_data);
                }
            });
        }
    })
};


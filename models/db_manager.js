
var mysql = require('mysql');
var fs = require('fs-extra');
var pool = mysql.createPool({
	connectionLimit: 150,
	host: '127.0.0.1',
	user: 'root',
	password: 'raviewme5',
	database: 'raview'
});

var ip = 'http://54.65.222.144';

exports.review_list = function(datas, callback){
	var size = 10;
	var begin = (datas-1) * size;

	pool.getConnection(function(err, conn) {
		if(err) console.error('err',err);

		var sql = 'SELECT review_num, review_subject, review_content, DATE_FORMAT(review_time, "%y-%m-%d %h:%i:%s") review_time ,review_score, review_report, profile_num FROM review ORDER BY review_num DESC LIMIT ?,?';

		conn.query('SELECT count(*) cnt FROM review', [], function(err, row){
			if(err) console.error('err',err);

			var cnt = row[0].cnt;
			var total_page = Math.ceil(cnt / size);
			var page_size = 20;
			var start_page = (Math.floor((page-1) / page_size))* page_size+1;
			var end_page = start_page + (page_size-1);
			if(end_page > total_page){
				end_page = total_page;
			}
			var max = cnt - ((page-1)*size);
			conn.query(sql, [begin])

		})
	});
};

item.review_num%></td>
    			<td><%=item.review_time%></td>
    			<td><%=item.profile_num%></td>
    			<td><%=item.review_subject%></td>
    			<td><%=item.review_content%></td>
    			<td><%=item.review_score%></td>
    			<td><%=item.review_report%></td>
    		</tr>
const express = require('express');
const app = express();
// const mysql = require('mysql');
const sqlite3 = require('sqlite3');
const http = require('http');
const fs = require('fs');
const nodemailer = require('nodemailer');
var url = require('url');
const bodyParser = require('body-parser');
const dialog = require('dialog');
const session = require('express-session');
const methodOverride = require('method-override');

app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(session({
	secret: 'mySecret',
  name: 'user', // optional
  saveUninitialized: false,
  resave: false, 
}));
// app.use('/public', express.static('/public'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var server = http.createServer(app);
var router = express.Router();

// var currentUser = ''; // username
// var currentAccount = ''; // user account
// var chpwd = false; // want to change password or not
// var del = false; // want to delete the event or not
// var signupevent = '';

// let connection = new sqlite3.Database(':memory:');
// let connection = new sqlite3.Database('signUp');
let connection = new sqlite3.Database('signUp');

// var connection = sqlite3.createConnection({
// 	host : 'localhost',
// 	user : 'root' ,
// 	password : 'eric9105' ,
// 	database : 'signUp' /////
// });

// -Mail---------------------------------------------------------------------
var transport = nodemailer.createTransport({
				// service: 'Gmail',
				host: "smtp.gmail.com",
				port: 465,
				auth: {
					user: 'h6871828@gmail.com',
					pass: 'gediuflqsafmgbuw'
				}
			});
// Server start-----------------------------------------------------------------------------
server.listen(3000, '127.0.0.1', function(){
	console.log('Example app listrn on port 3000');
})

// start page---------------------------------------------------------------------
router.get('/', function(req, res){
	var count = 0;
	var qs = "select count(*) from event";
	var uName;
	if(req.session.loggedin == true) {
		uName = req.session.userName;
	} else {
		uName = "Guest"
	}
	// connection.query(qs, function(err, rows, fields){
	connection.all(qs, function(err, rows, fields){
		if(err)
			throw err;
		else if(rows[0]['count(*)'] == 0){
			// content = '目前無活動';
			res.render('list', {num: count, text: rows, logged: req.session.loggedin, n: uName});
		} else if(rows[0]['count(*)'] > 0) {
			count = rows[0]['count(*)'];
			// console.log(count + "  999");
			
			var ans = "select event.name, event.date, event.limits, event.admin, event.eid, people.number from event, people where event.eid=people.active";
			connection.all(ans, function(err, row, fields){
				if(err) 
					console.log(err)
				else
					res.render('list', {num: count, text: row, logged: req.session.loggedin, n: uName});
			})
		}
	})
	// res.render('index');
	// if(req.session.loggedin == true) {
	// 	res.redirect('/lists/admin');
	// } else {
	// 	// req.session.loggedin = false;
	// 	// req.session.isGuest = true;
	// 	res.render('/list', {root: '.'});
	// 	// res.sendFile('list.ejs', { root: 'views' });
	// 	// res.redirect('/lists');
	// 	// res.sendFile('index.html', { root: '.' });
	// }
	// res.sendFile('index.html', { root: '.' });
	// res.redirect('/guest');
	// var content = fs.readFileSync('index.html');
	// res.writeHeader(200,{'Content-Type':'text/html'});
  // res.write(content);
	// res.end();
})

// 註冊---------------------------------------------------------------------------
router.get('/register', function(req, res){
	res.sendFile('register.html', { root: '.' });
	// res.render('register.ejs');

})

// 註冊測試(比對資料庫資料)-----------------------------------------------------------------------
router.post('/register', function(req, res){
	var userName = req.body.name;
	var userAcont = req.body.account;
	var userEmail = req.body.email;
	var userPwd = req.body.password;
	var userRePwd = req.body.repassword;
	if(userPwd != userRePwd){
		dialog.info('please confirm your password again!');
		// res.render('register', {warning: 'wrong'});
		return;
	}else {
		// console.log(userAcont + "   " + userPwd);
		// check whether the account exist
		var check = "select count(*) from user where user.account='" + userAcont + "'";
		// connection.query(check, function(err, rows, feilds){
		connection.get(check, function(err, rows, feilds){
			// console.log(rows);
			if(err)
				throw err;
			if(rows['count(*)'] == 1){
				// console.log('qqqqqqqqq');
				// res.render('index', {warning: 'this account has been registered'});
				dialog.info('this account has been used');

				// var wrong = document.getElementById('warning');
				// wrong.textContent('This account has existed');
			} else {
				var userNum;
				var reg = "select count(*) from user";
				connection.get(reg, function(err, num){
					userNum = num['count(*)']+1;
					connection.get('insert into user(name, account, password, email, uid) values(?, ?, ?, ?, ?)', [userName, userAcont, userPwd, userEmail, userNum], function(err, result){
						if(err)
							throw err;
						else{
							dialog.info('register success! \n\nredirect to login page');
							res.redirect('/');
						}
					})
				})
			}
		})
	}
})

// 登入-------------------------------------------------------------------------
router.get('/login', function(req, res) {
	res.sendFile('login.html', { root: '.' });
})

router.post('/login', function(req, res){
	var userAcont = req.body.account;
	var userPwd = req.body.password;
	// console.log(userAcont + "   " + userPwd);
	var check = "select count(*), user.name from user where user.account='" + userAcont + "'";
	connection.all(check, function(err, rows, feilds){
	// var valid = "select password from user where user.account='" + userAcont + "'";
	// connection.query(valid, function(err, row, fields){
		if(err)
			throw err;
		else if(rows[0]['count(*)'] == 1){
			var valid = "select password, uid from user where user.account='" + userAcont + "'";
			connection.all(valid, function(err, row, fields){
			// var check = "select count(*), user.name from user where user.account='" + userAcont + "' and user.password='" + userPwd + "'";
			// connection.query(check, function(err, rows, feilds){
				if(err)
					throw err;
				else {
					if(row[0]['password'] == userPwd) { // 登入成功
						// console.log('kkkkkkk');
						// dialog.info('login success');
						// currentUser = rows[0]['name'];
						// currentAccount = userAcont;
						// session
						req.session.loggedin = true;
						req.session.isGuest = false;
						req.session.chpwd = false;
						req.session.del = false;
						req.session.userName = rows[0]['name'];
						req.session.account = userAcont;
						req.session.uid = row[0]['uid']
						// console.log(rows[0]['name']);
						// console.log(currentUser);
						// setInterval(function(){}, 2000);
						res.redirect('/');
						// res.sendfile('system.html');
					} else {
						dialog.info('accountt or password is incorrect!');
						res.redirect('/login');
					}
				}
			})
		} 
	})
})

// Guest login-------------------------------------------------------------------
router.get('/guest', function(req, res){
	// dialog.info('login as guest');
	req.session.loggedin = false;
	req.session.isGuest = true;
	// currentUser = "";
	// currentAccount = "";
	// setInterval(function(){}, 2000);
	res.redirect('/');
})

// list page----------------------------------------------------------------
// router.get('/', function(req, res){
// 	// console.log(req.session);
// 	// if(req.session.loggedin == false && req.session.isGuest == false) {
// 	// 	res.redirect('/');
// 	// }	else 
// 	// if(req.session.loggedin == true || req.session.isGuest == true) {
// 		// begin at 活動列表
// 	var count = 0;
// 	var qs = "select count(*) from event";
// 	var uName;
// 	if(req.session.loggedin == true) {
// 		uName = req.session.userName;
// 	} else {
// 		uName = "Guest"
// 	}
// 	// connection.query(qs, function(err, rows, fields){
// 	connection.all(qs, function(err, rows, fields){
// 		if(err)
// 			throw err;
// 		else if(rows[0]['count(*)'] == 0){
// 			// content = '目前無活動';
// 			res.render('list', {num: count, text: rows, logged: req.session.loggedin, n: uName});
// 		} else if(rows[0]['count(*)'] > 0) {
// 			count = rows[0]['count(*)'];
// 			// console.log(count + "  999");
			
// 			var ans = "select event.name, event.date, event.limits, event.admin, event.eid, people.number from event, people where event.eid=people.active";
// 			connection.all(ans, function(err, row, fields){
// 				if(err) 
// 					console.log(err)
// 				else
// 					res.render('list', {num: count, text: row, logged: req.session.loggedin, n: uName});
// 			})
// 		}
// 	})
// 	// } 
// 	// else {
// 	// 	dialog.info('Please login');
// 	// 	res.redirect('/');
// 	// }
// })

// 個人資料修改------------------------------------------------------------------
router.get('/personal', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login');
	// 	res.redirect('/');
	// } else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your profile');
	// 	res.redirect('/lists');
	// }	else 
	if(req.session.loggedin == true){
		var getData = "select password, email from user where user.account='" + req.session.account + "'";
		connection.all(getData, function(err, row, fields){
			res.render('personal', {chpwd: req.session.chpwd, name: req.session.userName, account: req.session.account, pass: row[0]['password'], email: row[0]['email'], logged: req.session.loggedin});
			// req.session.chpwd = false;
		})
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
})

router.get('/personal/change', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login');
	// 	res.redirect('/');
	// } else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your profile');
	// 	res.redirect('/lists');
	// }	else 
	if(req.session.loggedin == true) {
		req.session.chpwd = !req.session.chpwd;
		res.redirect('/personal');
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
})

router.put('/personal', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login');
	// 	res.redirect('/');
	// } else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your profile');
	// 	res.redirect('/lists');
	// }	else 
	if(req.session.loggedin == true) {
		// var newName = req.body.name;
		req.session.userName = req.body.name;
		var newEmail = req.body.email;

		var newData = "update user set name=?, email=? where user.account ='" + req.session.account + "'";
		connection.get(newData, [req.session.userName, newEmail], function(err, row, field){
			if(err)
				throw err;
			else {
				var chAdmin = "update event set admin=? where event.admin='" + req.session.userName + "'";
				connection.get(chAdmin, [req.session.userName], function(err, rows, fields){
					if(err)
						throw err;
					else {
						// req.session.account = newName;
						// req.session.userName = newName;
						dialog.info('Succeed!');
						res.redirect('/admin');
					}
				})
			}
		})
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
})

router.put('/personal/change', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login');
	// 	res.redirect('/');
	// } else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your profile');
	// 	res.redirect('/lists');
	// }	else 
	if(req.session.loggedin == true){
		var oldPass = req.body.oldPass;
		var newPass = req.body.newPass;
		var newPassAgain = req.body.newPassAgain;

		var checkpass = "select password from user where user.account='" + req.session.account + "'";
		connection.get(checkpass, function(err, row, field){
			if(err)
				throw err;
			else {
				if(oldPass != row['password']) {  // check old pass
					dialog.info('Please ensure your original password is correct!');
					req.session.chpwd = true;
					res.redirect('/personal');
				} else { // cheak newpass and newpassagain
					if(newPass != newPassAgain) {
						dialog.info('New password and New password again must be the same!');
						req.session.chpwd = true;
						res.redirect('/personal');
					} else {
						var updatePass = "update user set password=? where user.account = '" + req.session.account + "'";
						connection.get(updatePass, [newPass], function(err, rows, fields){
							if(err)
								throw err;
							else {
								dialog.info('Succeed!');
								res.redirect('/personal');
							}
						})
					}
				}
			}
		})
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
})

// 報名--------------------------------------------------------------------------
router.post('/activity/:eid/signup', function(req, res){
	if(req.session.loggedin == true) {
		// console.log("ok");
		connection.get('insert into matchs(account, active) values(?,?)', [req.session.account, eid], function(err, result){
			if(err)
				throw err;
			else {
				var getNum = "select number from people where people.active='" + eid + "'";
				var oriNum = 0;
				connection.all(getNum, function(err, rows, fields){
					if(err)
						throw err;
					else {
						oriNum = rows[0]['number'];
						var newNum = parseInt(oriNum);
						newNum = newNum+1;
						var update = "update people set number='" + newNum + "' where active='" + eid + "'";
						connection.get(update, function(err, row, field){
							if(err)
								throw err;
							else {
								// signupevent = '';
								dialog.info('sign up succeed');
								res.redirect('/');
							}
						})
					}
				})
			}
		});
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
})

router.get('/activity/:wanted/signup', function(req, res){
	// if(req.params.wanted == 'ok') {
		// connection.get('insert into matchs(account, active) values(?,?)', [currentAccount, signupevent], function(err, result){
		// 	if(err)
		// 		throw err;
		// 	else {
		// 		var getNum = "select number from people where people.active='" + signupevent + "'";
		// 		var oriNum = 0;
		// 		connection.all(getNum, function(err, rows, fields){
		// 			if(err)
		// 				throw err;
		// 			else {
		// 				oriNum = rows[0]['number'];
		// 				var newNum = parseInt(oriNum);
		// 				newNum = newNum+1;
		// 				var update = "update people set number='" + newNum + "' where active='" + signupevent + "'";
		// 				connection.get(update, function(err, row, field){
		// 					if(err)
		// 						throw err;
		// 					else {
		// 						signupevent = '';
		// 						dialog.info('sign up succeed');
		// 						res.redirect('/lists');
		// 					}
		// 				})
		// 			}
		// 		})
		// 	}
		// });
	// }else {
	// if(req.session.loggedin == false) {
	// 	dialog.info('Please login to sign up');
	// 	// res.redirect('/system');
	// } 
	if(req.session.loggedin == true) {
		let target = req.params.wanted;
		eid = target;
		var filled = "select number, limits from people, event where active='" + eid + "' and eid='" + eid + "'";
		connection.all(filled, function(err, rows, fields){
			if(err)
				throw err;
			else {
				if(rows[0]['number'] == rows[0]['limits']){
					dialog.info('人數已達上限');
					res.redirect('/');
				} else {
					var already = "select count(*) from matchs where matchs.account='" + req.session.account + "' and matchs.active='" + eid + "'";
					connection.all(already, function(err, result, fields){
						if(result[0]['count(*)'] == 1) {
							dialog.info('已經報名過了!');
							res.redirect('/');
						} else {
							var qr = "select name, date from event where event.eid='" + eid + "'";
							var resultDate = '';
							connection.all(qr, function(err, row, fields){
								if(err)
									throw err;
								else{
									resultDate = row[0]['date'];
									res.render('signup', {eid: eid, event: row[0]['name'],date: resultDate, name: req.session.userName, logged: req.session.loggedin});
								}
							})
						}
					})
				}
			}
		})
	} else {
		dialog.info('Please login');
		res.redirect('/');
	}
	// }
})

// 管理活動	-------------------------------------------------------------------------
router.get('/admin', function(req, res){
// router.get('/:eid/admin', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login!');
	// 	res.redirect('/');
	// }	else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your activities!');
	// 	res.redirect('/lists');
	// }	else 
	if(req.session.loggedin == true) {
		// res.sendfile('system.html');
		var content = '';
		// res.render('system', { content: content });
		var count = 0;
		var qs = "select count(*) from event where event.admin='" + req.session.userName + "'";
		connection.all(qs, function(err, rows, fields){
			if(err)
				throw err;
			else if(rows[0]['count(*)'] == 0){
				// content = '目前無管理活動';
				res.render('admin', {num: count, text: rows, logged: req.session.loggedin, userName: req.session.userName});
			} else if(rows[0]['count(*)'] > 0) {
				count = rows[0]['count(*)'];
				// console.log(count + "  999");
				
				var ans = "select event.name, date, limits, admin, eid, people.number from event, people where event.admin='" + req.session.userName + "' and event.eid=people.active";
				connection.all(ans, function(err, row, fields){
					// console.log(row[0]['name'] + " " + row[0]['date'] + " " + row[0]['limits'])
					// res.sendfile('admin.html');  //
					res.render('admin', {num: count, text: row, logged: req.session.loggedin, userName: req.session.userName});
				})
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

router.post('/new', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login!');
	// 	res.redirect('/');
	// }	else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your activities!');
	// 	res.redirect('/lists');
	// } else 
	if(req.session.loggedin == true) {
		var eventName = req.body.name;
		var eventDate = req.body.date;
		var eventLimit = req.body.limit;
		var eventDes = req.body.describe;

		var getNum = "select num from ids where types = 'event'";
		connection.get(getNum, function(err, result) {
			console.log(result);
			var eid = result['num']+1;
			connection.get('insert into event(name, date, admin, limits, description, eid) values(?, ?, ?, ?, ?, ?)', [eventName, eventDate, req.session.userName, eventLimit, eventDes, eid], function(err, result){
				if(err)
					throw err;
				else{
					dialog.info('Create succeed! \n\nredirect to admin page');
					res.redirect('/admin');
				}
			})
			var updateeid = "update ids set num=? where types = 'event'";
			connection.get(updateeid, [eid], function(err, result) {
				if(err)
					throw err;
			})
		})

		connection.get('insert into people(active, number) values(?, ?)', [eventName, 0], function(err, result){
			if(err)
				throw err;
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

// 編輯完活動後修改資料庫---------------------------------------------------------------------------
router.put('/activity/:eid/edit', function(req, res){
	if(req.session.loggedin == true) {
		// console.log("asdadasd");
		var modDate = req.body.date;
		var modLimit = req.body.limit;
		var modDes = req.body.describe;

		var mod = "update event set date=?, limits=?, description=? where event.eid ='" + req.params.eid + "'";
		connection.get(mod, [modDate, modLimit, modDes], function(err, row, fields){
			if(err)
				throw err;
			else {
				dialog.info('modify succeed!');
				// send email
				var getNum = "select count(*) from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
				var Num;
				connection.get(getNum, function(err, row){
					Num = row['count(*)'];
				})
				var getEmail = "select user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
				connection.all(getEmail, function(err, rows, fields){
					console.log(rows);
					// console.log(rows['email']);
					var emails = [];
					for(let i = 0; i < Num; i++) {
						console.log(rows[i]['email'] + "  hhh");
						emails.push(rows[i]['email']);
						// emails = rows[i]['email'];
						var options = {
							from: 'h6871828@gmail.com',
							to: rows[i]['email'],
							subject: 'event modified',
							text: 'the activity you signed up has been modified, please go to our website to see details'
						};
						transport.sendMail(options, function(error, info){
							if(err)
								console.log(error);
							else
								console.log('OKOk');
						})
					}
					// console.log(emails);
					// var options = {
					// 	from: 'h6871828@gmail.com',
					// 	to: emails,
					// 	subject: 'event modified',
					// 	text: 'the activity you signed up has been modified, please go to our website to see details'
					// };
					// transport.sendMail(options, function(error, info){
					// 	if(err)
					// 		console.log(error);
					// 	else
					// 		console.log('OKOk');
					// })
					res.redirect('/admin');
				})
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

// 活動管理->編輯------------------------------------------------------------------------
// router.get('/system/edit/:event', function(req, res){
router.get('/activity/:eid/edit', function(req, res){
	if(req.session.loggedin == true) {
		// console.log(req.params.event);
		var target = "select name, date, limits, description from event where event.eid='" + req.params.eid + "'";
		connection.all(target, function(err, row, fields){
			if(err)
				throw err;
			else {
				var signlist = "select count(*), user.name, user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
				connection.all(signlist, function(err, rows, fields){
					console.log(rows);
					// var count = rows.size;
					var count = rows[0]['count(*)'];
					res.render('edit', {del: req.session.del, eid: req.params.eid, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description'], num: count, man: rows, logged: req.session.loggedin, userName: req.session.userName});
					del = false;
				})
				// res.render('modify', {del: del, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description']});
				// del = false;
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

// delete---------------------------------------------------------------------------
router.get('/activity/:eid/edit/check', function(req, res){
	if(req.session.loggedin == true) {
		req.session.del = true;
		var target = "select name, date, limits, description from event where event.eid='" + req.params.eid + "'";
		connection.all(target, function(err, row, fields){
			if(err)
				throw err;
			else {
				var getNum = "select count(*) from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = '" + req.session.account + "'";
				connection.get(getNum, function(err, result) {
					var nums = result['count(*)'];
					var signlist = "select user.name, user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = '" + req.session.account + "'";
					connection.all(signlist, function(err, rows, fields){
						console.log(rows);
						// var count = rows.length;
						var count = nums;
						// console.log(del);
						res.render('delete', {del: req.session.del, eid: req.params.eid, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description'], num: count, man: rows, logged: req.session.loggedin});
						req.session.del = false;
					})
				})
				// var signlist = "select count(*), user.name, user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = '" + req.session.account + "'";
				// connection.all(signlist, function(err, rows, fields){
				// 	console.log(rows);
				// 	// var count = rows.length;
				// 	var count = rows[0]['count(*)'];
				// 	// console.log(del);
				// 	res.render('delete', {del: req.session.del, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description'], num: count, man: rows});
				// 	req.session.del = false;
				// })
				// res.render('modify', {del: del, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description']});
				// del = false;
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

router.delete('/activity/:event/edit', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login!');
	// 	res.redirect('/');
	// }	else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your activities!');
	// 	res.redirect('/lists');
	// } else 
	if(req.session.loggedin == true) {
		var pwd = req.body.pass;
		var check = "select password from user where user.account='" + req.session.account + "'";
		connection.get(check, function(err, row, fields){
			if(err)
				throw err;
			else if(pwd == row['password']) {
				var deleteEvent = "delete from event where name=?";
				connection.all(deleteEvent, [req.params.event], function(err, rows, fields){
					if(err)
						throw err;
					else {
						var deletePeople = "delete from people where people.active=?";
						connection.all(deletePeople, [req.params.event], function(err, result, fields){
							if(err)
								throw err;
							else {
								// send email
								var getNum = "select count(*) from user, matchs where matchs.active='" + req.params.event + "' and matchs.account = user.account"
								var nums;
								connection.get(getNum, function(err, result){
									nums = result['count(*)'];
								});
								var getEmail = "select user.email from user, matchs where matchs.active='" + req.params.event + "' and matchs.account = user.account";
								connection.all(getEmail, function(err, find, fields){
									console.log(find);
									var emails = [];
									// var nums = find['count(*)']
									for(let i = 0; i < nums; i++) {
										emails.push(find[i]['email']);
									}
									var options = {
										from: 'kkread0101@gmail.com',
										to: emails,
										subject: 'event canceled',
										text: 'the activity you sign up has been canceled, please go to the website to check details'
									};
									transport.sendMail(options, function(error, info){
										if(err)
											console.log(error);
										else {
											// console.log('OKOk');
											// delete matchs
											var test = "select count(*) from matchs where matchs.active='" + req.params.event + "'";
											connection.all(test, function(err, ans, fields){
												if(err)
													throw err;
												else if(ans[0]['count(*)'] > 0){
													var deleteMatchs = "delete from matchs where matchs.active=?";
													connection.all(deleteMatchs, [req.params.event], function(err, results, fields){
														if(err)
															throw err;
														else {
															dialog.info('deleted');
															res.redirect('/admin');
														}
													})
												} else {
													dialog.info('deleted');
													res.redirect('/admin');
												}
											})
										}
									})
								})
							}
						})
					}
				})
			} else if(pwd != row[0]['password']) {  // password not correct
				dialog.info('password is not correct');
				var destination = '/activity/' + req.params.event + '/edit/check';
				res.redirect(destination);
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

// 我的活動-------------------------------------------------------------------------- 
router.get('/mine', function(req, res){
	// if(req.session.loggedin == false) {
	// 	dialog.info('Please login to check your activities!');
	// 	res.redirect('/lists');
	// }
	if(req.session.loggedin == true) {
		// res.sendfile('system.html');
		var content = '';
		var count = 0;
		var qs = "select count(*) from matchs where matchs.account='" + req.session.account + "'";
		connection.all(qs, function(err, rows, fields){
			if(err)
				throw err;
			else if(rows[0]['count(*)'] == 0){
				// content = '目前無活動';
				res.render('mine', {num: count, text: rows, logged: req.session.loggedin, userName: req.session.userName});
			} else if(rows[0]['count(*)'] > 0) {
				count = rows[0]['count(*)'];
				// console.log(count + "  999");
				var ans = "select event.name, date, limits, admin, eid, people.number from event, matchs, people where matchs.account='" + req.session.account + "' and matchs.active=event.eid and event.eid=people.active";
				connection.all(ans, function(err, row, fields){
					// console.log(row[0]['name'] + " " + row[0]['date'] + " " + row[0]['limits'])
					res.render('mine', {num: count, text: row, logged: req.session.loggedin, userName: req.session.userName});
				})
			}
		})
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
})

// 發起活動-------------------------------------------------------------------------
router.get('/new', function(req, res){
	// if(req.session.loggedin == false && req.session.isGuest == false) {
	// 	dialog.info('Please login!');
	// 	res.redirect('/');
	// }	else if(req.session.isGuest == true) {
	// 	dialog.info('Please login to see your activities!');
	// 	res.redirect('/lists');
	// } else {
	// 	res.sendFile('create.html', { root: '.' });
	// }
	if(req.session.loggedin) {
		res.render('create', {logged: req.session.loggedin, userName: req.session.userName});
	} else {
		dialog.info('Please login!');
		res.redirect('/');
	}
	// if(currentUser == '') {
	// 	dialog.info('Please login to create new activity!');
	// 	res.redirect('/system');
	// }else
})

// 活動頁面-------------------------------------------------------------------------
router.get('/activity/:eid', function(req, res){
	var eid = req.params.eid;
	var qy = "select name, date, description from event where event.eid='" + eid + "'";
	
	connection.all(qy, function(err, rows, fields){
		var can = true; // 可否報名

		var fill = "select number, limits from people, event where active='" + eid + "' and eid='" + eid + "'";
		connection.all(fill, function(err, row, fields){
			if(err)
				throw err;
			else {
				if(row[0]['number'] == row[0]['limits']){
					can = false;
				}
				var qr = "select count(*) from matchs where matchs.account='" + req.session.account + "' and matchs.active='" + eid + "'";
				connection.all(qr, function(err, result, fields){
					if(err)
						throw err;
					else{
						if(result[0]['count(*)'] == 1) {
							can = false;
						} 
						// let userName = "Guest";
						if(req.session.loggedin == true) {
							// userName = req.session.userName;
							res.render('detail', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], can: can, logged: req.session.loggedin, userName: req.session.userName});
						} else {
							res.render('detail', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], can: can, logged: req.session.loggedin, userName: "Guest"});
						}
						// res.render('detail', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], can: can, logged: req.session.loggedin, userName: req.session.userName});
					}
				})
			}
		})
	})
})

// 退出活動--------------------------------------------------------------------------
router.get('/activity/:eid/giveup', function(req, res){
	var eid = req.params.eid;
	var qy = "select name, date, description from event where event.eid='" + eid + "'";
	connection.all(qy, function(err, rows, fields){
		res.render('giveup', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], logged: req.session.loggedin, userName: req.session.userName});
	})
})

// 退出後刪除報名資料--------------------------------------------------------------------
router.get('/activity/:eid/quit', function(req, res){
	var eid = req.params.eid;
	var getNum = "select number from people where people.active='" + eid + "'";
	var oriNum = 0;
	connection.get(getNum, function(err, rows, fields){
		if(err)
			throw err;
		else {
			oriNum = rows['number'];
			var newNum = parseInt(oriNum);
			newNum = newNum - 1;
			var update = "update people set number='" + newNum + "' where active='" + eid + "'";
			connection.get(update, function(err, row, field){
				if(err)
					throw err;
				else {
					var del = "delete from matchs where account=? and active=?"; 
					connection.get(del, [req.session.account, eid], function(err, result, fields){
						if(err)
							throw err;
						else {
							dialog.info('succeed!');
							res.redirect('/mine');
						}
					})
				}
			})
		}
	})
})

// 登出----------------------------------------------------------------------------
router.get('/logout', function(req, res){
	req.session.destroy();
	// currentUser = '';
	// currentAccount = '';
	res.redirect('/');
})

// apply router--------------------------------------------------------------------
app.use('/', router);

app.use(express.json());

app.set('view engine', 'ejs');

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

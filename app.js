const express = require('express');
const app = express();
// const mysql = require('mysql');
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const flash = require('connect-flash');
require('dotenv').config();

app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use(session({
	secret: 'mySecret',
  name: 'user', // optional
  saveUninitialized: false,
  resave: false, 
}));
app.use(flash());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var router = express.Router();

let connection = new sqlite3.Database('signUp.db');

// -Mail---------------------------------------------------------------------
var transport = nodemailer.createTransport({
				// service: 'Gmail',
				host: "smtp.gmail.com",
				port: 465,
				auth: {
					user: process.env.MAIL,
					pass: process.env.MAIL_PASS
				}
});
// Server start-----------------------------------------------------------------------------
// server.listen(8080, '127.0.0.1', function(){
// 	console.log('Example app listrn on port 3000');
// })

const server = app.listen(8080, () => {
  // const port = server.address().port
  console.log('Example app listening on port', 3000);
})

// start page---------------------------------------------------------------------
router.get('/', function(req, res){
	let count = 0;
	let qs = "select count(*) from event";
	let uName;
	if(req.session.loggedin == true) {
		uName = req.session.userName;
	} else {
		uName = "Guest"
	}
	connection.all(qs, function(err, rows, fields){
		if(err)
			throw err;
		else if(rows[0]['count(*)'] == 0){
			// 目前無活動
			res.render('list', {num: count, text: rows, logged: req.session.loggedin, n: uName, message: req.flash('message')});
		} else if(rows[0]['count(*)'] > 0) {
			count = rows[0]['count(*)'];
			
			let ans = "select event.name, event.date, event.limits, event.admin, event.eid, people.number from event, people where event.eid=people.active";
			connection.all(ans, function(err, row, fields){
				if(err) 
					console.log(err)
				else
					res.render('list', {num: count, text: row, logged: req.session.loggedin, n: uName, message: req.flash('message')});
			})
		}
	})
})

// 註冊---------------------------------------------------------------------------
router.get('/register', function(req, res){
	res.render('register', {message: req.flash('message')});
})

// 註冊測試(比對資料庫資料)-----------------------------------------------------------------------
router.post('/register', function(req, res){
	let userName = req.body.name;
	let userAcont = req.body.account;
	let userEmail = req.body.email;
	let userPwd = req.body.password;
	let userRePwd = req.body.repassword;
	if(userPwd != userRePwd){
		req.flash('message', 'password and re-password is not match!');
		res.redirect('/register');
	}else {
		let check = "select count(*) from user where user.account='" + userAcont + "'";
		connection.get(check, function(err, rows, feilds){
			if(err)
				throw err;
			if(rows['count(*)'] == 1){
				req.flash('message', 'this account has been used');
				res.redirect('/register');
			} else {
				let userNum;
				let reg = "select count(*) from user";
				connection.get(reg, function(err, num){
					userNum = num['count(*)']+1;
					connection.get('insert into user(name, account, password, email, uid) values(?, ?, ?, ?, ?)', [userName, userAcont, userPwd, userEmail, userNum], function(err, result){
						if(err)
							throw err;
						else{
							req.flash('message', 'register success!');
							res.redirect('/login');
						}
					})
				})
			}
		})
	}
})

// 登入-------------------------------------------------------------------------
router.get('/login', function(req, res) {
	res.render('login', {message: req.flash('message')});
})

router.post('/login', function(req, res){
	let userAcont = req.body.account;
	let userPwd = req.body.password;
	let check = "select count(*), user.name from user where user.account='" + userAcont + "'";
	connection.all(check, function(err, rows, feilds){
		if(err)
			throw err;
		else if(rows[0]['count(*)'] == 1){
			let valid = "select password, uid from user where user.account='" + userAcont + "'";
			connection.all(valid, function(err, row, fields){
				if(err)
					throw err;
				else {
					if(row[0]['password'] == userPwd) { // 登入成功
						// session
						req.session.loggedin = true;
						req.session.isGuest = false;
						req.session.chpwd = false;
						req.session.del = false;
						req.session.userName = rows[0]['name'];
						req.session.account = userAcont;
						req.session.uid = row[0]['uid']
						res.redirect('/');
					} else {
						req.flash('message', 'accountt or password is incorrect!');
						res.redirect('/login');
					}
				}
			})
		} else {
				req.flash('message', 'this account is not exist');
				res.redirect('/login');
		}
	})
})

// Guest login-------------------------------------------------------------------
router.get('/guest', function(req, res){
	req.session.loggedin = false;
	req.session.isGuest = true;
	res.redirect('/');
})

// 個人資料修改------------------------------------------------------------------
router.get('/personal', function(req, res){
	if(req.session.loggedin == true){
		let getData = "select password, email from user where user.account='" + req.session.account + "'";
		connection.all(getData, function(err, row, fields){
			res.render('personal', {chpwd: req.session.chpwd, name: req.session.userName, account: req.session.account, pass: row[0]['password'], email: row[0]['email'], logged: req.session.loggedin, message: req.flash('message')});
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.get('/personal/change', function(req, res){
	if(req.session.loggedin == true) {
		req.session.chpwd = !req.session.chpwd;
		res.redirect('/personal');
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.put('/personal', function(req, res){
	if(req.session.loggedin == true) {
		req.session.userName = req.body.name;
		let newEmail = req.body.email;

		let newData = "update user set name=?, email=? where user.account ='" + req.session.account + "'";
		connection.get(newData, [req.session.userName, newEmail], function(err, row, field){
			if(err)
				throw err;
			else {
				let chAdmin = "update event set admin=? where event.admin='" + req.session.userName + "'";
				connection.get(chAdmin, [req.session.userName], function(err, rows, fields){
					if(err)
						throw err;
					else {
						req.flash('message', 'Succeed!');
						res.redirect('/admin');
					}
				})
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.put('/personal/change', function(req, res){
	if(req.session.loggedin == true){
		let oldPass = req.body.oldPass;
		let newPass = req.body.newPass;
		let newPassAgain = req.body.newPassAgain;

		let checkpass = "select password from user where user.account='" + req.session.account + "'";
		connection.get(checkpass, function(err, row, field){
			if(err)
				throw err;
			else {
				if(oldPass != row['password']) {  // check old pass
					req.flash('message', 'password is incorrect!');
					req.session.chpwd = true;
					res.redirect('/personal');
				} else { // cheak newpass and newpassagain
					if(newPass != newPassAgain) {
						req.flash('message', 'New password and New password again must be the same!');
						req.session.chpwd = true;
						res.redirect('/personal');
					} else {
						let updatePass = "update user set password=? where user.account = '" + req.session.account + "'";
						connection.get(updatePass, [newPass], function(err, rows, fields){
							if(err)
								throw err;
							else {
								req.flash('message', 'Edit Succeed!');
								req.session.chpwd = false;
								res.redirect('/admin');
							}
						})
					}
				}
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 報名--------------------------------------------------------------------------
router.post('/activity/:eid/signup', function(req, res){
	if(req.session.loggedin == true) {
		connection.get('insert into matchs(account, active) values(?,?)', [req.session.account, eid], function(err, result){
			if(err)
				throw err;
			else {
				let getNum = "select number from people where people.active='" + eid + "'";
				let oriNum = 0;
				connection.all(getNum, function(err, rows, fields){
					if(err)
						throw err;
					else {
						oriNum = rows[0]['number'];
						let newNum = parseInt(oriNum);
						newNum = newNum+1;
						let update = "update people set number='" + newNum + "' where active='" + eid + "'";
						connection.get(update, function(err, row, field){
							if(err)
								throw err;
							else {
								req.flash('message', 'sign up succeed');
								res.redirect('/');
							}
						})
					}
				})
			}
		});
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.get('/activity/:wanted/signup', function(req, res){
	if(req.session.loggedin == true) {
		let target = req.params.wanted;
		eid = target;
		let filled = "select number, limits from people, event where active='" + eid + "' and eid='" + eid + "'";
		connection.all(filled, function(err, rows, fields){
			if(err)
				throw err;
			else {
				if(rows[0]['number'] == rows[0]['limits']){
					// 人數已達上限
					req.flash('message', 'The number of signed up people has reach the maximum number');
					res.redirect('/');
				} else {
					let already = "select count(*) from matchs where matchs.account='" + req.session.account + "' and matchs.active='" + eid + "'";
					connection.all(already, function(err, result, fields){
						if(result[0]['count(*)'] == 1) {
							// 已經報名過了
							req.flash('message', 'You have signed up');
							res.redirect('/');
						} else {
							let qr = "select name, date from event where event.eid='" + eid + "'";
							let resultDate = '';
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
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 管理活動	-------------------------------------------------------------------------
router.get('/admin', function(req, res){
	if(req.session.loggedin == true) {
		let count = 0;
		let qs = "select count(*) from event where event.admin='" + req.session.userName + "'";
		connection.all(qs, function(err, rows, fields){
			if(err)
				throw err;
			else if(rows[0]['count(*)'] == 0){
				// content = '目前無管理活動';
				res.render('admin', {num: count, text: rows, logged: req.session.loggedin, userName: req.session.userName, message: req.flash('message')});
			} else if(rows[0]['count(*)'] > 0) {
				count = rows[0]['count(*)'];
				
				let ans = "select event.name, date, limits, admin, eid, people.number from event, people where event.admin='" + req.session.userName + "' and event.eid=people.active";
				connection.all(ans, function(err, row, fields){
					res.render('admin', {num: count, text: row, logged: req.session.loggedin, userName: req.session.userName, message: req.flash('message')});
				})
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.post('/new', function(req, res){
	if(req.session.loggedin == true) {
		let eventName = req.body.name;
		let eventDate = req.body.date;
		let eventLimit = req.body.limit;
		let eventDes = req.body.describe;

		let getNum = "select num from ids where types = 'event'";
		connection.get(getNum, function(err, result) {
			let eid = result['num']+1;
			connection.get('insert into event(name, date, admin, limits, description, eid) values(?, ?, ?, ?, ?, ?)', [eventName, eventDate, req.session.userName, eventLimit, eventDes, eid], function(err, result){
				if(err)
					throw err;
				else{
					req.flash('message', 'New activity is Created!');
					res.redirect('/admin');
				}
			})
			let updateeid = "update ids set num=? where types = 'event'";
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
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 編輯完活動後修改資料庫---------------------------------------------------------------------------
router.put('/activity/:eid/edit', function(req, res){
	if(req.session.loggedin == true) {
		let modDate = req.body.date;
		let modLimit = req.body.limit;
		let modDes = req.body.describe;

		let mod = "update event set date=?, limits=?, description=? where event.eid ='" + req.params.eid + "'";
		connection.get(mod, [modDate, modLimit, modDes], function(err, row, fields){
			if(err)
				throw err;
			else {
				req.flash('message', 'the activity is edited!');
				// send email
				let getNum = "select count(*) from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
				let Num;
				connection.get(getNum, function(err, row){
					Num = row['count(*)'];
				})
				let getEmail = "select user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
				connection.all(getEmail, function(err, rows, fields){
					let emails = [];
					for(let i = 0; i < Num; i++) {
						emails.push(rows[i]['email']);
						emails = rows[i]['email'];
						let options = {
							from: process.env.MAIL,
							to: rows[i]['email'],
							subject: 'event modified',
							text: 'the activity you signed up has been modified, please go to our website to see details'
						};
						console.log(options);
						transport.sendMail(options, function(error, info){
							if(err)
								console.log(error);
						})
					}
					res.redirect('/admin');
				})
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 活動管理->編輯------------------------------------------------------------------------
router.get('/activity/:eid/edit', function(req, res){
	if(req.session.loggedin == true) {
		let target = "select name, date, admin, limits, description from event where event.eid='" + req.params.eid + "'";
		connection.all(target, function(err, row, fields){
			if(err)
				throw err;
			else {
				if(row[0]['admin'] != req.session.userName){
					res.redirect('/');
				} else {
					let signlist = "select count(*), user.name, user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = user.account";
					connection.all(signlist, function(err, rows, fields){
						let count = rows[0]['count(*)'];
						res.render('edit', {del: req.session.del, eid: req.params.eid, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description'], num: count, man: rows, logged: req.session.loggedin, userName: req.session.userName, message: req.flash('message')});
						del = false;
					})
				}
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// delete---------------------------------------------------------------------------
router.get('/activity/:eid/edit/check', function(req, res){
	if(req.session.loggedin == true) {
		if(req.session.del == true) {
			req.session.del = false;
			let des = '/activity/' + req.params.eid + '/edit';
			res.redirect(des);
		} else {
			req.session.del = true;
			let target = "select name, date, limits, description from event where event.eid='" + req.params.eid + "'";
			connection.all(target, function(err, row, fields){
				if(err)
					throw err;
				else {
					let getNum = "select count(*) from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = '" + req.session.account + "'";
					connection.get(getNum, function(err, result) {
						let nums = result['count(*)'];
						let signlist = "select user.name, user.email from user, matchs where matchs.active='" + req.params.eid + "' and matchs.account = '" + req.session.account + "'";
						connection.all(signlist, function(err, rows, fields){
							let count = nums;
							res.render('delete', {del: req.session.del, eid: req.params.eid, n: row[0]['name'], d: row[0]['date'], l: row[0]['limits'], des: row[0]['description'], num: count, man: rows, logged: req.session.loggedin, message: req.flash('message')});
							req.session.del = false;
						})
					})
				}
			})
		}
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

router.delete('/activity/:event/edit', function(req, res){
	if(req.session.loggedin == true) {
		let pwd = req.body.pass;
		let check = "select password from user where user.account='" + req.session.account + "'";
		connection.get(check, function(err, row, fields){
			if(err)
				throw err;
			else if(pwd == row['password']) {
				let deleteEvent = "delete from event where name=?";
				connection.all(deleteEvent, [req.params.event], function(err, rows, fields){
					if(err)
						throw err;
					else {
						let deletePeople = "delete from people where people.active=?";
						connection.all(deletePeople, [req.params.event], function(err, result, fields){
							if(err)
								throw err;
							else {
								// send email
								let getNum = "select count(*) from user, matchs where matchs.active='" + req.params.event + "' and matchs.account = user.account"
								let nums;
								connection.get(getNum, function(err, result){
									nums = result['count(*)'];
								});
								let getEmail = "select user.email from user, matchs where matchs.active='" + req.params.event + "' and matchs.account = user.account";
								connection.all(getEmail, function(err, find, fields){
									let emails = [];
									for(let i = 0; i < nums; i++) {
										emails.push(find[i]['email']);
									}
									let options = {
										from: process.env.MAIL,
										to: emails,
										subject: 'event canceled',
										text: 'the activity you sign up has been canceled, please go to the website to check details'
									};
									transport.sendMail(options, function(error, info){
										if(err)
											console.log(error);
										else {
											// delete matchs
											let test = "select count(*) from matchs where matchs.active='" + req.params.event + "'";
											connection.all(test, function(err, ans, fields){
												if(err)
													throw err;
												else if(ans[0]['count(*)'] > 0){
													let deleteMatchs = "delete from matchs where matchs.active=?";
													connection.all(deleteMatchs, [req.params.event], function(err, results, fields){
														if(err)
															throw err;
														else {
															req.flash('message', 'the activity is canceled');
															res.redirect('/admin');
														}
													})
												} else {
													req.flash('message', 'the activity is canceled');
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
			} else if(pwd != row['password']) {  // password not correct
				req.flash('message', 'password is not correct');
				let destination = '/activity/' + req.params.event + '/edit/check';
				res.redirect(destination);
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 我的活動-------------------------------------------------------------------------- 
router.get('/mine', function(req, res){
	if(req.session.loggedin == true) {
		let count = 0;
		let qs = "select count(*) from matchs where matchs.account='" + req.session.account + "'";
		connection.all(qs, function(err, rows, fields){
			if(err)
				throw err;
			else if(rows[0]['count(*)'] == 0){
				res.render('mine', {num: count, text: rows, logged: req.session.loggedin, userName: req.session.userName, message: req.flash('message')});
			} else if(rows[0]['count(*)'] > 0) {
				count = rows[0]['count(*)'];
				let ans = "select event.name, date, limits, admin, eid, people.number from event, matchs, people where matchs.account='" + req.session.account + "' and matchs.active=event.eid and event.eid=people.active";
				connection.all(ans, function(err, row, fields){
					res.render('mine', {num: count, text: row, logged: req.session.loggedin, userName: req.session.userName, message: req.flash('message')});
				})
			}
		})
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 發起活動-------------------------------------------------------------------------
router.get('/new', function(req, res){
	if(req.session.loggedin) {
		res.render('create', {logged: req.session.loggedin, userName: req.session.userName});
	} else {
		req.flash('message', 'Please login');
		res.redirect('/');
	}
})

// 活動頁面-------------------------------------------------------------------------
router.get('/activity/:eid', function(req, res){
	let eid = req.params.eid;
	let qy = "select name, date, description from event where event.eid='" + eid + "'";
	
	connection.all(qy, function(err, rows, fields){
		let can = true; // 可否報名

		let fill = "select number, limits from people, event where active='" + eid + "' and eid='" + eid + "'";
		connection.all(fill, function(err, row, fields){
			if(err)
				throw err;
			else {
				if(row[0]['number'] == row[0]['limits']){
					can = false;
				}
				let qr = "select count(*) from matchs where matchs.account='" + req.session.account + "' and matchs.active='" + eid + "'";
				connection.all(qr, function(err, result, fields){
					if(err)
						throw err;
					else{
						if(result[0]['count(*)'] == 1) {
							can = false;
						} 
						if(req.session.loggedin == true) {
							res.render('detail', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], can: can, logged: req.session.loggedin, userName: req.session.userName});
						} else {
							res.render('detail', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], can: can, logged: req.session.loggedin, userName: "Guest"});
						}
					}
				})
			}
		})
	})
})

// 退出活動--------------------------------------------------------------------------
router.get('/activity/:eid/giveup', function(req, res){
	let eid = req.params.eid;
	let qy = "select name, date, description from event where event.eid='" + eid + "'";
	connection.all(qy, function(err, rows, fields){
		res.render('giveup', {eid: eid, n: rows[0]['name'], d: rows[0]['date'], des: rows[0]['description'], logged: req.session.loggedin, userName: req.session.userName});
	})
})

// 退出後刪除報名資料--------------------------------------------------------------------
router.get('/activity/:eid/quit', function(req, res){
	let eid = req.params.eid;
	let getNum = "select number from people where people.active='" + eid + "'";
	let oriNum = 0;
	connection.get(getNum, function(err, rows, fields){
		if(err)
			throw err;
		else {
			oriNum = rows['number'];
			let newNum = parseInt(oriNum);
			newNum = newNum - 1;
			let update = "update people set number='" + newNum + "' where active='" + eid + "'";
			connection.get(update, function(err, row, field){
				if(err)
					throw err;
				else {
					let del = "delete from matchs where account=? and active=?"; 
					connection.get(del, [req.session.account, eid], function(err, result, fields){
						if(err)
							throw err;
						else {
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
	res.redirect('/');
})

// apply router--------------------------------------------------------------------
app.use('/', router);

app.use(express.json());

app.set('view engine', 'ejs');

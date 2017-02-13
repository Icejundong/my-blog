// var express = require('express');
// var router = express.Router();

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;

//引入User类
var User = require('../models/user')
// 引入Post类
var Post = require('../models/post')
// 引入comment类
Comment = require('../models/comment.js');
//加密的模块
var crypto = require('crypto')
// 引入multer插件
var multer = require('multer');
// 配置multer
var storage = multer.diskStorage({
	destination : function (req,file,cb) {
		cb(null,'./public/uploads')
    },
	filename : function (req,file,cb) {
		// cb(null,file.originalname)
		var filename = req.session.user.name + new Date().getTime() + file.originalname;
		cb(null,filename)
    }
})
var upload = multer({storage:storage})

// 权限的函数
function checkLogin(req,res,next){
	if(!req.session.user){
		req.flash('error','未登录')
		res.redirect('/login')
	}
	next()
}
function checkNotLogin(req,res,next){
	if(req.session.user){
		req.flash('error','已登录')
		res.redirect('back')
	}
	next()
}

module.exports = function(app){
	// 首页路由
	// app.get('/',function(req,res){
	// 	Post.getAll(null,function (err,posts) {
	// 		if(err){
	// 			posts = [];
	// 		}
     //        res.render('index',{
     //            title :"首页",
     //            //登陆以后，会吧登陆信息放到session里边
     //            user : req.session.user,
	// 			posts : posts,
     //            success : req.flash('success').toString(),
     //            error : req.flash('error').toString()
     //        })
     //    })
    //
	// });
	// 首页分页路由
    app.get('/', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成 number 类型
        var page = parseInt(req.query.p) || 1;
        //查询并返回第 page 页的 10 篇文章
        Post.getTen(null, page, function (err, posts, total) {
            if (err) {
                posts = [];
            }
            res.render('index', {
                title: '主页',
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 3 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
				pageCount : Math.ceil(total / 3)
            });

        });
    });


	// 注册页面
    app.get('/reg',checkNotLogin)
	app.get('/reg',function(req,res){
		res.render('reg',{
			title :'注册',
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		})
	});

	// 注册行为
	app.post('/reg',function(req,res){
		//先获取req请求体的信息
		var name = req.body.name;
		var password = req.body.password;
		var password_re = req.body['password-repeat']
		var email = req.body.email;
		
		if(password_re != password){
			req.flash('error','两次输入密码不一致')
			return res.redirect('/reg')
		}
		//对密码加密处理
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex')
		
		//整理一下，放到对象里面去
		var newUser = new User({
			name : name,
			password : password,
			email : req.body.email
		})
		
		//检查用户名是否存在
		User.get(newUser.name,function(err,user){
			if(err){
				req.flash('error',err)
				return res.redirect('/')
			}
			if(user){
				req.flash('error','用户名已经存在')
				return res.redirect('/reg')
			}
			//如果正常 ，可以存放数据库
			newUser.save(function(err,user){
				req.flash('error',err)
				return res.redirect('/reg')
			})
			//存放到session中
			req.session.user = newUser;
			req.flash('success','注册成功')
			res.redirect('/')
		})
	});

	// 登陆页面
    app.get('/login',checkNotLogin)
	app.get('/login',function(req,res){
		res.render('login',{
			title : '登陆',
			user : req.session.user,
            success : req.flash('success').toString(),
            error : req.flash('error').toString()

		})
	})

	// 登陆行为
	app.post('/login',function(req,res){
		// 1,先生成密码的加密
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		// 2,检查用户名是否存在
		User.get(req.body.name,function (err,user) {
			// 如果不存在，重定向到login页面
			if(!user){
				req.flash('error','用户不存在')
				return res.redirect('/login')
			}
			// 3,如果用户名存在，检查密码是否一样
			if(user.password != password){
				req.flash('error','密码错误')
				return res.redirect('/login')
			}
			// 4,最后将用户登录信息存放到session中
			req.session.user = user;
			req.flash('success','登录成功');
			return res.redirect('/')
        })
	})

	// 提交文章
    app.get('/post',checkLogin)
	app.get('/post',function(req,res){
		res.render('post',{
			title : '发表',
            user : req.session.user,
            success : req.flash('success').toString(),
            error : req.flash('error').toString()
		})
	})
	
	// 提交文章行为
	app.post('/post',function(req,res){
		//获取用户名
		var currentUser = req.session.user.name;
		// 第一个参数是用户名。第二个参数是文章的标题，第三个参数是文章的正文
		var newPost = new Post(currentUser,req.body.title,req.body.post)
		newPost.save(function (err) {
			if(err){
				req.flash('error',err)
				return res.redirect('/')
			}
			req.flash('success','发布成功')
			return res.redirect('/')
        })
	})

	// 退出
    app.get('/logout',checkLogin)
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','退出成功');
		res.redirect('/')
	})


	//上传页面
	app.get('/upload',checkLogin)
	app.get('/upload',function (req,res) {
		res.render('upload',{
			title: '上传',
			// 在app.js中 使用本地存储locals已经存放了。不用再重复写了。
			user : req.session.user,
			success : req.flash('success').toString(),
			error : req.flash('error').toString()
		})
    })
	
	// 上传行为
	app.post('/upload',checkLogin)
	app.post('/upload', upload.array('field1',5),function (req,res) {
		req.flash('success','上传成功');
		return res.redirect('/upload')
    })

	//查询一个用户的所有文章
	// app.get('/u/:name',function (req,res) {
	// 	// 1.使用User.get方法查询用户是否存在
	// 	User.get(req.params.name,function (err,user) {
	// 		if(!user){
	// 			req.flash('error','该用户不存在')
	// 			res.redirect('/')
	// 		}
	// 		// 2.Post.getAll()方法，获取到当前用户的所有文章
	// 		Post.getAll(req.params.name,function (err,posts) {
	// 			if(err){
	// 				req.flash('error',err)
	// 				return res.redirect('/')
	// 			}
	// 			// 3.如果没有错误，那么就把用户的所有的文章返回给user页面
	// 			res.render('user',{
	// 				title : '用户 ' + req.params.name +' 的文章列表',
	// 				posts : posts,
     //                user : req.session.user,
     //                success : req.flash('success').toString(),
     //                error : req.flash('error').toString()
	// 			})
     //        })
     //    })
    // })

	// 检索功能
	app.get('/search',function (req,res) {
		Post.search(req.query.keyword,function (err,posts) {
			if(err){
				req.flash('error',err)
				return res.redirect('/')
			}
			res.render('search',{
				title : " Search ：" + req.query.keyword,
				post : posts,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
        })
    })


	// 分页查询一个用户的所有文章
    app.get('/u/:name', function (req, res) {
        var page = parseInt(req.query.p) || 1;
        //检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/');
            }
            //查询并返回该用户第 page 页的 10 篇文章
            Post.getTen(user.name, page, function (err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 3 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString(),
					pageCount : Math.ceil(total / 3)
                });
            });
        });
    });



	// 查询一篇文章
	app.get('/u/:name/:minute/:title',function (req,res) {
		Post.getOne(req.params.name,req.params.minute,req.params.title,function (err,post) {
			if(err){
				req.flash('error',err)
				return res.redirect('/')
			}
			return res.render('article',{
				title : req.params.title,
				post:post,
                user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
        })
    })

	// 编辑文章
	app.get('/edit/:name/:minute/:title',checkLogin)
	app.get('/edit/:name/:minute/:title',function (req,res) {
		var currentUser = req.session.user;
		Post.edit(currentUser.name,req.params.minute,req.params.title,function (err,post) {
			if(err){
				req.flash('error',err)
				return res.redirect('back')
			}
			res.render('edit',{
				title : '编辑文章' + ':'+ req.params.title,
				post : post,
				user : req.session.user,
				success : req.flash('success').toString(),
				error : req.flash('error').toString()
			})
        })
    })


	//添加表单提交处理,实现更新
	app.post('/edit/:name/:minute/:title',checkLogin)
	app.post('/edit/:name/:minute/:title',function (req,res) {
		var currentUser = req.session.user;
		Post.update(currentUser,req.params.minute,req.body.title,req.params.post,function (err) {
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.minute + '/' + req.params.title)
			if(err){
				req.flash('error',err)
				return res.redirect(url) // 出错，返回文章首页
			}
			req.flash('success','修改文章成功');
			return res.redirect(url)  // 成功，返回文章页
        })
    })

	// 删除文章
    app.get('/remove/:name/:minute/:title', checkLogin);
    app.get('/remove/:name/:minute/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.minute, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
        });
    });

	// 添加留言
    app.post('/comment/:name/:minute/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.minute, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功!');
            res.redirect('back');
        });
    });
}




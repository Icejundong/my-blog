var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// 引入settings文件
var settings = require('./settings')

// 引入flash模块
var flash = require('connect-flash')

// 支持会话
var session = require('express-session')

// 将会话保存在session中
var MongoStore = require('connect-mongo')(session)


// 第一步，修改routes
var routes = require('./routes/index');

var app = express();

// 第二步，修改模板引擎。使用ejs
// view engine setup

// 设置视图的文件夹
app.set('views', path.join(__dirname, 'views'));
// 设置视图的模板引擎
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public

// 网站的小图标
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 调试时候
app.use(logger('dev'));

// 设置post请求
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 设置cookieParser模块，使之支持cookie
app.use(cookieParser());

// 设置静态资源。public
app.use(express.static(path.join(__dirname, 'public')));

// 使用flash
app.use(flash())

// 使用session
app.use(session({

	// 加密，对session进行加密处理
	secret:settings.cookieSecret,
	// 设置值
	key:settings.db,
	// cookie的生命周期
	cookie:{maxAge:1000*60*60*24*30},
	// 这一步是将session存放到数据库中去
	store:new MongoStore({
		// 数据库的地址
		url : 'mongodb://localhost/lastblog'
	})
}))

// app.use('/', index);
// app.use('/users', users);

// 第三步，将应用实例app传入到路由文件中使用
routes(app)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 在本地存储一下user，success，error三个变量
app.use(function (req,res,next) {
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString()
    next()
})


// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development

  // locals类似于是express中的本地存储。存储了message和error
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// 增加启动的操作
app.listen(3000,function(){
	console.log('node is ok !!!')
})


module.exports = app;

// db.js

// 数据库连接

// 1，引入数据库的配置文件
var settings = require('../settings')

// 2,创建数据库连接示例
var Db = require('mongodb').Db;

// 3,连接命令
var Connection = require('mongodb').Connection;

// 4,服务器
var Server = require('mongodb').Server;

// 5,暴露连接示例
module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe:true})

var mongodb = require('./db');

//创建一个用户的对象
function User(user){
	//用户名
	this.name = user.name;
	// 密码
	this.password = user.password;
	//邮箱
	this.email = user.email;
}

module.exports = User;


// 添加方法

User.prototype.save = function(callback){
	var user = {
		name : this.name,
		password : this.password,
		email : this.email
	}
	//接下来。打开数据库
	mongodb.open(function(err,db){
		// 一旦数据库打开出现错误，这里直接将错误对象，返回给callback回调函数
		if(err){
			return callback(err)
		}
		//如果没有发生错误，读取user集合,如果没有user集合，则自动创建user集合。
		db.collection('users',function(err,collection){
			// collection 是读取到users集合里面的所有的内容
			if(err){
				mongodb.close();
				return callback(err)
			}
			//插入数据
			collection.insert(user,{safe:true},function(err,user){
				mongodb.close()
				if(err){
					return callback(err);
				}
				callback(null,user[0])  //返回用户数据中的用户名
			})
		})
	})
}

//查询方法.
User.get = function(name,callback){
//	打开数据库
	mongodb.open(function(err,db){
		if(err){
			return callback(err)
		}
		//读取users集合
		db.collection('users',function(err,collection){
			if(err){
				mongodb.close()
				return callback(err)
			}
			//如果 没有错误，根据name查询在集合里面有没有
			collection.findOne({name:name},function(err,user){
				mongodb.close();
				if(err){
					return callback(err)
				}
				callback(null,user) // 直接返回数据，用户信息
			})
		})
	})
}

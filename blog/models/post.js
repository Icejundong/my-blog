/**
 * Created by Administrator on 2017/2/9.
 */




var mongodb = require('./db')
// 引入markdown模块
var markdown = require('markdown').markdown;

function Post(name,title,post) {
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post;
// 保存文章的方法
Post.prototype.save = function (callback) {
    //获取当前时间
    var date = new Date();
    // 存储一下时间的各种格式，方便存储
    var time = {
        date : date,
        year : date.getFullYear(),
        month : date.getFullYear() + '-' + (date.getMonth() + 1),
        day : date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
        minute : date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' '
                + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' + date.getSeconds()
    }

    // 要存入数据库的内容
    var post = {
        name : this.name,
        time : time,
        title : this.title,
        post : this.post,
        //新增留言字段
        comments : [],
        pv : 0
    }

    // 打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err)
        }
        // 读取post集合
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            // 插入文档
            collection.insert(post,{safe : true},function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

// 获取文章的方法
// Post.getAll = function (name,callback) {
//     mongodb.open(function (err,db) {
//         if(err){
//             return callback(err)
//         }
//         db.collection('posts',function (err,collection) {
//
//             if(err){
//                 mongodb.close()
//                 return callback(err)
//             }
//             var query = {}
//             if(name){
//                 query.name = name;
//             }
//             collection.find(query).sort({time:-1}).toArray(function (err,docs) {
//                 mongodb.close();
//                 if(err){
//                     return callback(err)
//                 }
//                 // 将文章的所有内容用markdown解析一下，再显示
//                 docs.forEach(function (doc) {
//                     doc.post = markdown.toHTML(doc.post);
//                 });
//                 callback(null,docs)
//             })
//         })
//     })
// }


//一次获取十篇文章
Post.getTen = function(name, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
                if (name) {
                    query.name = name;
            }
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1)*3,
                    limit: 3
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析 markdown 为 html
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    // 返回文章列表和文章的总条数
                    callback(null, docs, total);
                });
            });
        });
    });
};


//获取一篇文章
Post.getOne = function(name, minute, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.minute": minute,
                "title": title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                if (doc) {
                    //每访问 1 次，pv 值增加 1
                    collection.update({
                        "name": name,
                        "time.minute": minute,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    }, function (err) {
                        mongodb.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    //解析 markdown 为 html
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null, doc);//返回查询的一篇文章
                }
            });
        });
    });
};

// 返回原始发表的内容(markdown格式)
// （跟获取一篇文章一样）
Post.edit = function(name, minute, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name": name,
                "time.minute": minute,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    });
};




// 更新一篇文章
Post.update = function(name, minute, title, post, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "name": name,
                "time.minute": minute,
                "title": title
            }, {
                $set: {post: post}
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};


// 删除文章
Post.remove = function(name, minute, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({
                "name": name,
                "time.minute": minute,
                "title": title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

// 文章检索
//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
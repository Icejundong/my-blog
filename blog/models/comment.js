/**
 * Created by Administrator on 2017/2/13.
 */

// 数据库连接
var mongodb = require('./db');

// 新建comment留言的构造函数
function Comment(name, minute, title, comment) {
    this.name = name;
    this.minute = minute;
    this.title = title;
    // 留言的内容
    this.comment = comment;
}
module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function(callback) {
    //数据整理
    var name = this.name,
        minute = this.minute,
        title = this.title,
        comment = this.comment;
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
            //通过用户名、时间及标题查找文档，并把一条留言对象添加到该文档的 comments 数组里
            collection.update({
                // 查询条件
                // 定位到一篇文章
                "name": name,
                "time.minute":minute,
                "title": title
            }, {
                // 把留言插入到文章的comment字段里面去
                $push: {"comments": comment}
            } , function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
const mongoose = require("mongoose"), bcrypt = require("bcrypt");


let chatSchema = new mongoose.Schema({
    _creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: {type: String, required: [true, "empty"], trim: true},
    time: {type: String}
})

let userSchema = new mongoose.Schema({
    user: {type: String, trim: true, required: [true, "Name can't be blank"], set: function(user) {
        return user.toLowerCase();
    }, get: function(user) {
        return user.charAt(0).toUpperCase() + user.slice(1)     

    }, validate: {
        isAsync: true,
        validator: function(v, cb) {
            User.count({user: v}, (err, count) => {
                cb(count == 0)
            })
        }, msg: "User already exist"
    }},

    password: {type: String, required: [true, "Password can't be blank"]},
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: "Chat"}]
});

userSchema.statics.authenticate = function(user, password, callback) {
    User.findOne({user: user}, function(error, user) {
        if (error) {
            return callback(error);
        
        } else if( !user ) {
            let err = "User not found";
            return callback(err);
        }

        bcrypt.compare(password, user.password, function(err, result) {
            if (result) {
                return callback(null,user);
            } else {
                let err = "Incorrect password";
                return callback(err);
            }
        }) 

    })

}

userSchema.pre("save", function(next) {
    if (this.messages.length == 0) {
        let user = this;

        bcrypt.hash(user.password, 10, function(err, hash) {
            if (err) {
                return next(err)
            } else {
                user.password = hash;
                next();
            }
        })
    } else {
        next();
    }

});

let Chat = mongoose.model("Chat", chatSchema);
let User = mongoose.model("User", userSchema);

module.exports.Chat = Chat;
module.exports.User = User;



const express = require("express"), mongoose = require("mongoose"), bodyparser = require("body-parser"), session = require("express-session"), MongoStore = require("connect-mongo")(session), Entities = require('html-entities').XmlEntities, path = require("path");


let app = express();
let router = express.Router();

const server = require("http").createServer(app);
const client = require("socket.io").listen(server);

const mongouser = process.env.MONGODB_USER;
const mongopass = process.env.MONGODB_PASS;

//Creating connection to MongoDB
mongoose.connect(`mongodb://${mongouser}:${mongopass}@ds249818.mlab.com:49818/chat`, (err) => {
    if (err) return console.log(err);
    else console.log("Connection Created.....")
})

let db = mongoose.connection

const entities = new Entities();

let sessionMiddlewear = session({

    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: db
    })
})
sharedsession = require("express-socket.io-session");

app.set("view engine", "pug")
app.use(express.static(path.join(__dirname ,'views')))
//app.use("/static", express.static(path.join(__dirname + "/public")))

app.set("NODE_ENV", process.env.NODE_ENV || "development")
app.set("port", process.env.PORT || 8080);
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))


app.use(sessionMiddlewear);

client.use(sharedsession(sessionMiddlewear, {
    autoSave: true
}));

app.use((req, res, next) => {
    res.locals.name = req.session.name
    next()
})

const model = require("./model/model")
let clients = {}

client.on("connection", socket => {
    let session = socket.handshake.session;

    if (session.name) {
        clients[socket.id] = session.name.charAt(0).toUpperCase() + session.name.slice(1)
    }

    client.sockets.emit("online", clients)

    socket.on("input", data => {

        data = entities.encode(data)

        model.User.findOne({ _id: session.user }, (err, doc) => {

            model.Chat.create({ _creator: doc._id, text: data, time: getTime() }, (err, msg) => {
                if (err) {
                    if (err.errors["text"].message == "empty") return res.send("Bhai kuch bhi kr lai ni hoga")
                }
 
                doc.messages.push(msg)

                doc.save({ validateBeforeSave: false }, err => {
                    if (err) return console.log(err)

                    model.Chat.findOne({}, '-_id -__v', {sort:{"_id": "-1"}, limit: 1} ).populate({ path: "_creator", select: "user -_id" }).exec((err, _user) => {

                        let user = _user.toObject({getters : true});

                        if (session.name == user._creator.user) {
                            socket.emit("yours",  user)
                        }

                        socket.broadcast.emit('their', user);

                    })

                })
            })
        })

    })

    socket.on("disconnect", () => {
        delete clients[socket.id]
    })

    socket.on("log_out", () => {
        session.destroy((err) => {
            if (err) console.log(err)
        })
        socket.disconnect()
        client.sockets.emit("online", clients)
    })

})

//const routes = require("./routes")
//app.use("/", router)
const middlewear = require("./middlewear")

app.get("/", (req, res) => {
    return res.render("test")
})

// router.get("/", middlewear.validateLogout, (req, res) => {
//     res.render("index")
// })

// router.post("/signup", (req, res, next) => {

//     let { user, password } = req.body
//     user = entities.encode(user)
//     model.User.create({ user, password }, (err, user) => {
//         if (err) {
//             if (err.errors["user"]) return res.render("signup", { err: err.errors["user"].message })
//             if (err.errors["password"]) return res.render("signup", { err: err.errors["password"].message })
//         }

//         req.session.user = user._id;
//         req.session.name = user.user;
//         res.redirect("/");
//     })

// })

// router.post("/", (req, res) => {
//     let user_name = req.body.user.toLowerCase()
//     model.User.authenticate(user_name, req.body.password, (err, user) => {
//         if (err || !user) {
//             if (err == "User not found") return res.render("index", { err })
//             else if (err == "Incorrect password") return res.render("index", { err })

//         } else {
            
//             req.session.user = user._id;
//             req.session.name = user.user;
//             return res.redirect("/chat")
//         }

//     })
// })

// router.get("/chat", middlewear.validateLogin, (req, res) => {
   
//    model.Chat.find({}, '-_id -__v', {limit: 1000} ).populate({path: "_creator", select: "user -_id" }).exec((err, _user) => {

//         res.render("chat", {msg: _user})
//    })

// })

// router.get("/signup", middlewear.validateLogout, (req, res) => res.render("signup"))

// router.get("/logout", (req, res, next) => {
//     req.session.destroy((err) => {
//         if (err) return next(err)

//         res.redirect("/")
//     })

// })

// router.all("*", (req, res, next) => {
//     let err = {};
//     err.msg = "404 Not found"
//     err.status = 404
//     return next(err);
// })


function getTime() {
    let _time = new Date().toLocaleString().split(",")[1]
    let t = _time.trim().split(" ")
    let state = " " + t.pop()
    let v = t[0].split(":")
    v.pop()
    return v.join(":") + state
}

// app.use((err, req, res, next) => {
//     if (app.get("NODE_ENV") == "development") {
//         res.status(err.status)
//         console.log("error")
//         return next(err.msg || err)
//     } else {
//         return res.send("<p>404 Not found</p>");
//     }
// })


server.listen(app.get("port"), () => {
    console.log(`Express server listening on port ${app.get('port')}`)
})

const express = require("express"), mongoose = require("mongoose"), bodyparser = require("body-parser"), session = require("express-session"), MongoStore = require("connect-mongo")(session), Entities = require('html-entities').XmlEntities;


let app = express();

const server = require("http").createServer(app);
const client = require("socket.io").listen(server);

//Creating connection to MongoDB
mongoose.connect("mongodb://MONGODB_USER:MONGODB_PASS@ds249818.mlab.com:49818/chat", (err) => {
    if (err) return console.log(err);
    else console.log("Connection Created.....")
})

let db = mongoose.connection

const entities = new Entities();

let sessionMiddlewear = session({
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    },
    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: db
    })
})
sharedsession = require("express-socket.io-session");

app.use(express.static(__dirname + "/public"))


app.set("view engine", "pug")
app.set("NODE_ENV", process.env.NODE_ENV || "development")
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

                doc.save(err => {
                    if (err) return console.log(err)
                    
                    model.Chat.findOne({}, '-_id -__v', {sort:{"_id": "-1"}, limit: 1} ).populate({ path: "_creator", select: "user -_id" }).exec((err, _user) => {

                        let user = _user.toObject({getters : true});
                        user.time = _user.time

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
        session.destroy()
        socket.disconnect()
        client.sockets.emit("online", clients)
    })

})

const routes = require("./routes")

app.use("/", routes)


function getTime() {
    let _time = new Date().toLocaleString().split(",")[1]
    let t = _time.trim().split(" ")
    let state = " " + t.pop()
    let v = t[0].split(":")
    v.pop()
    return v.join(":") + state
}

app.all("*", (req, res, next) => {
    let err = {};
    err.msg = "404 Not found"
    err.status = 404
    return next(err);
})

app.use((err, req, res, next) => {
    if (app.get("NODE_ENV") == "development") {
        res.status(err.status)
        return next(err.msg || err)
    } else {
        return res.status(404).send(res.statusCode);
    }
})

app.set("port", process.env.PORT || 8080);

server.listen(app.get("port"), () => {
    console.log(`Express server listening on port ${app.get('port')}`)
})
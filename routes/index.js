const router = require("express").Router(),middlewear = require("./../middlewear"),model = require("./../model/model"), Entities = require('html-entities').XmlEntities;

let entities = new Entities()

router.get("/", middlewear.validateLogout, (req, res) => {
    res.render("index")
})

router.post("/signup", (req, res, next) => {

    let { user, password } = req.body
    user = entities.encode(user)
    model.User.create({ user, password }, (err, user) => {
        if (err) {
            if (err.errors["user"]) return res.render("signup", { err: err.errors["user"].message })
            if (err.errors["password"]) return res.render("signup", { err: err.errors["password"].message })
        }

        req.session.user = user._id;
        req.session.name = user.user;
        res.redirect("/");
    })

})

router.post("/", (req, res) => {
    let user_name = req.body.user.toLowerCase()
    model.User.authenticate(user_name, req.body.password, (err, user) => {
        if (err || !user) {
            if (err == "User not found") return res.render("index", { err })
            else if (err == "Incorrect password") return res.render("index", { err })

        } else {
            
            req.session.user = user._id;
            req.session.name = user.user;
            return res.redirect("/chat")
        }

    })
})

router.get("/chat", middlewear.validateLogin, (req, res) => {
   
   model.Chat.find({}, '-_id -__v', {limit: 1000} ).populate({path: "_creator", select: "user -_id" }).exec((err, _user) => {

        res.render("chat", {msg: _user})
   })

})

router.get("/signup", middlewear.validateLogout, (req, res) => res.render("signup"))

router.get("/logout", (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err)

        res.redirect("/")
    })

})

router.all("*", (req, res, next) => {
    let err = {};
    err.msg = "404 Not found"
    err.status = 404
    return next(err);
})


module.exports = router;
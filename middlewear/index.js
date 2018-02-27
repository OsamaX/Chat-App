module.exports.validateLogin = function(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect("/")
    }
}

module.exports.validateLogout = function(req, res, next) {
    if (req.session && req.session.user) {
        res.redirect("/chat")
    } else {
        next();
    }
}


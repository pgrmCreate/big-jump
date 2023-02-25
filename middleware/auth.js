const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.TOKEN_AUTH);
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
        next();
    } catch (e) {
        res.status(401).json({e})
    }
}

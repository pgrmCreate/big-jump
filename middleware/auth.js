const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'Dz99z5a9q6d5z9464fes98fd4sefse6ef9se465fDDRAMD_4dqz');
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
        next();
    } catch (e) {
        res.status(401).json({e})
    }
}

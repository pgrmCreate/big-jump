const User = require('../db/models/UserSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const tokenSecret = process.env.TOKEN_AUTH;

// Selon le flux, le cookie "user" peut déjà être parsé par Express
// ou encore être stocké comme une chaîne JSON.
function parseUserCookie(req) {
    const rawCookie = req.cookies ? req.cookies.user : null;
    if (!rawCookie) return null;
    if (typeof rawCookie === 'object') return rawCookie;

    try {
        return JSON.parse(rawCookie);
    } catch (error) {
        return null;
    }
}

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }).then((user) => {
        if (user === null) {
            res.status(401).json({ error: 'bad login' });
        } else {
            if (!tokenSecret) {
                return res.status(500).json({ error: 'missing token secret' });
            }

            bcrypt
                .compare(req.body.password, user.password)
                .then((valid) => {
                    if (!valid) {
                        res.status(401).json({ error: 'bad login' });
                    } else {
                        res.status(200).json({
                            userId: user.id,
                            email: user.email,
                            token: jwt.sign(
                                { userId: user.id },
                                tokenSecret,
                                { expiresIn: '24h' }
                            ),
                        });
                    }
                })
                .catch((error) => res.status(500).json({ error }));
        }
    }).catch(error => {
        res.status(500).json({ error });
    });
};

exports.reconnect = (req, res, next) => {
    if (!tokenSecret) {
        return res.status(500).json({ error: 'missing token secret' });
    }

    const targetCookieUser = parseUserCookie(req);

    if (!targetCookieUser || !targetCookieUser.token) {
        return res.status(400).json({ error: 'no token' });
    }

    try {
        const decodedToken = jwt.verify(
            targetCookieUser.token,
            tokenSecret
        );

        res.status(200).json(decodedToken);
    } catch (e) {
        res.status(500).json({ error: e });
    }
};

exports.signup = (req, res, next) => {
    bcrypt
        .hash(req.body.password, 10)
        .then((hash) => {
            const newUser = new User({
                email: req.body.email,
                password: hash,
            });

            newUser.save().then((addedUser) =>
                res.status(201).json({ message: 'new user added : ' + addedUser.id })
            );
        })
        .catch((error) => res.status(500).json({ errors: error }));
};

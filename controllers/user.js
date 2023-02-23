const User = require('../db/models/UserSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }).then((user) => {
        if (user === null) {
            res.status(401).json({ error: 'bad login' });
        } else {
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
                                'Dz99z5a9q6d5z9464fes98fd4sefse6ef9se465fDDRAMD_4dqz',
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
    if (targetCookieUser === '') {
        res.status(400).json({ error: 'no token' });
    }

    targetCookieUser = JSON.parse(targetCookieUser);

    try {
        const decodedToken = jwt.verify(
            targetCookieUser.token,
            'Dz99z5a9q6d5z9464fes98fd4sefse6ef9se465fDDRAMD_4dqz'
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

const GameConfig = require('../db/models/GameConfigSchema');

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

exports.getAll = (req, res, next) => {
    GameConfig.find({}).then((data) => {
        res.status(201).json(data)
    })
}

exports.get = (req, res, next) => {
    const targetId = req.params.id;

    GameConfig.findOne({_id: targetId}).then((data) => {
        res.status(201).json(data)
    }).catch((error) => res.status(500).json({error}));
}

exports.delete = (req, res, next) => {
    const targetId = req.params.id;

    GameConfig.findOne({_id : targetId}).then(async (data) => {
        await data.remove();

        res.status(200).json({});
    }).catch((error) => res.status(500).json({error}));
}

exports.update = (req, res, next) => {
    GameConfig.findOneAndUpdate({_id: req.body._id}, req.body).then((data) => {
        res.status(200).json(data);
    }).catch((error) => {
        res.status(500).json({error});
    });
}

exports.create = (req, res, next) => {
    const newConfigData = req.body;
    const newGameConfig = new GameConfig(newConfigData);

    newGameConfig.createdAt = new Date();
    const cookieUser = parseUserCookie(req);
    const authorId = (req.auth && req.auth.userId) || (cookieUser ? cookieUser.userId : null);
    if (authorId) {
        newGameConfig.idAuthor = authorId;
    }

    newGameConfig.save()
        .then((addedGameConfig) => {
            res.status(201).json(newGameConfig);
        })
        .catch(error => res.status(500).json({error}));
}

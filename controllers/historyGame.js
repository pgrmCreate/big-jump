const jwt = require('jsonwebtoken');
const HistoryGame = require('../db/models/HistoryGameSchema');

exports.getAll = (req, res, next) => {
    HistoryGame.find({}).then((data) => {
        res.status(201).json(data)
    })
}

exports.create = (req, res, next) => {
    const newHistory = new HistoryGame(req.body);

    newHistory.save().then((data) => {
        res.status(200).json({data});
    })
}

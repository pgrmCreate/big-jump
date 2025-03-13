const jwt = require('jsonwebtoken');
const HistoryGame = require('../db/models/HistoryGameSchema');
const GameConfig = require("../db/models/GameConfigSchema");

exports.getAll = (req, res, next) => {
    HistoryGame.find({}).then((data) => {
        res.status(201).json(data)
    })
}

exports.get = (req, res, next) => {
    const targetId = req.params.id;

    HistoryGame.findOne({_id: targetId}).then((data) => {
        res.status(201).json(data)
    })
}

exports.create = (req, res, next) => {
    const newHistory = new HistoryGame(req.body);

    newHistory.save().then((data) => {
        res.status(204).json({data});
    })
}

exports.delete = (req, res, next) => {
    const targetId = req.params.id;

    HistoryGame.findOne({_id : targetId}).then(async (data) => {
        await data.remove();

        res.status(200).json({});
    }).catch((error) => res.status(500).json({error}));
}

exports.deleteByConfig = (req, res, next) => {
    const targetId = req.params.id;

    HistoryGame.deleteMany({configId : targetId})
        .then(async (data) => {
            res.status(200).json({})})
        .catch((error) => res.status(500).json({error}));
}

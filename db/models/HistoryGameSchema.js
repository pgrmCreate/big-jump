const mongoose = require('mongoose');
const {Schema} = require("mongoose");

const historyGame = new mongoose.Schema({
    userId : String,
    extraInfo : [mongoose.Schema.Types.Mixed],
    configId : String,
    sessions: [{
        stats: {
            score : Number,
        },
        rows: [{
            direction : String,
            positionX : Number,
            positionY: Number,
            typeAction: String,
            eventType: String,
            actionPointsLeft: String,
            amountValue : Number,
            score : Number,
        }]
    }]
});

module.exports = mongoose.model('HistoryGame', historyGame);

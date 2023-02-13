const mongoose = require('mongoose');
const {Schema} = require("mongoose");

const historyGame = new mongoose.Schema({
    userId : String,
    extraInfo : [mongoose.Schema.Types.Mixed],
    sessions: [{
        stats: {
            score : Number,
        },
        rows: [{
            direction : String,
            positionX : Number,
            positionY: Number,
            typeAction: String,
            amountValue : Number,
        }]
    }]
});

module.exports = module.exports = mongoose.model('HistoryGame', historyGame);

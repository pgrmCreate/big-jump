const mongoose = require('mongoose');
const {Schema} = require("mongoose");

const gameConfigSchema = new mongoose.Schema({
    name: { type : String, required : true, unique : true },
    idAuthor : {type : String},
    createdAt: Date,
    drawTypeGain: { type : String, required : true, unique : false },
    drawTypeThreat: { type : String, required : true, unique : false },
    endPage: { type : String },
    gainLevelAmount: { type : Number, required : true},
    threatLevelAmount: { type : Number, required : true},
    gameInterfacePage: {
        actionPoints: { type : String, required : true},
        exploite: { type : String, required : true},
        explore: { type : String, required : true},
        score: { type : String, required : true},
    },
    height :  { type : Number, required : true},
    width :  { type : Number, required : true},
    initPositionX :  { type : Number, required : true},
    initPositionY :  { type : Number, required : true},
    instructionPage :  { type : String},
    participantInfo :  { type : [String]},
    roundLeftMax :  { type : Number},
    startPoint :  { type : Number},
    tryAmount :  { type : Number},
    zones :  [{
        id: { type : Number},
        color: { type : String},
        isVisible: { type : Boolean},
        percentLoose: { type : Number},
        percentWin: { type : Number},
        targetGroupZone: { type : Number},
        x: { type : Number},
        y: { type : Number},
    }],
    lotLooseConfig : {
        randomAmount : {
            exploration : [Number],
            exploitation : [Number],
        }
    },
    lotWinConfig : {
        randomAmount : {
            exploration : [Number],
            exploitation : [Number],
        }
    },
    lots : [{
        exploration : {
            id: Number,
            isWin: Boolean,
            level: Number,
            maxDraw: Number,
            earnPointMin : Number,
            earnPointMax : Number,
            applyZones: [Number],
        },
        exploitation : {
            id: Number,
            isWin: Boolean,
            level: Number,
            maxDraw: Number,
            earnPointMin : Number,
            earnPointMax : Number,
            applyZones: [Number],
        }
    }],
    textsEvent: [Schema.Types.Mixed]
});

module.exports = mongoose.model('GameConfig', gameConfigSchema);

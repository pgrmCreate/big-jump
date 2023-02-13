const mongoose = require('mongoose');
const GameConfigSchema = require('./models/GameConfigSchema');


exports.LoadDb = async function () {
    await mongoose.connect('mongodb://127.0.0.1:27017/explo2');
}

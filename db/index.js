const mongoose = require('mongoose');
const GameConfigSchema = require('./models/GameConfigSchema');


exports.LoadDb = async function () {
    await mongoose.connect(`mongodb+srv://luccionijbaptiste:${process.env.DB_PASSWORD}@cluster0.zji75nl.mongodb.net/?retryWrites=true&w=majority`);
    console.log('db connected');
}

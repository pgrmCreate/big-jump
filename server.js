const express = require('express');
const app = express();
const port = 3001;
const db = require('./db/index');
const userRoutes = require('./routes/user');
const gameConfigRoutes = require('./routes/gameConfig');
const historyGameRoutes = require('./routes/historyGame');
const bodyParser =  require('body-parser');
const cors = require("cors");
const cookieParser = require("cookie-parser");

db.LoadDb().catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
};
app.use(cors(corsOptions));

app.use(cookieParser());

app.use(express.static('client/build'))

app.use('/api/user', userRoutes);
app.use('/api/gameconfig', gameConfigRoutes);
app.use('/api/history', historyGameRoutes);

app.listen(port, () => {
    console.log(`Launch app to port ${port}`)
})
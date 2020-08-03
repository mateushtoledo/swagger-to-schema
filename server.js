const express = require('express');
require('dotenv').config();
const cors = require('cors');

const SERVER_PORT = process.env.SERVER_PORT;
const CORS_OPTIONS = {
	origin: '*',
    optionsSuccessStatus: 200
};

const app = express();
const Routes = require("./config/Routes");

app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(Routes);

app.listen(SERVER_PORT, function() {
    console.info(`Senschema listening requests on ${SERVER_PORT}....`);
});
require("dotenv").config();
const express = require("express");
const { dbConfig } = require("./config/db");
const app = express();
dbConfig()
app.use(express.json())
const router = require("./router");
const apiResponse = require('./utils/apiResponse');
app.use(router)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
 apiResponse(res, statusCode,err.message || 'Internal server error') 
});
module.exports = app;
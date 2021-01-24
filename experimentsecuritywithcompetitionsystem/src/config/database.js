const mysql = require('mysql');
const config = require('./config');
//To find out more on createPool:
//https://www.npmjs.com/package/mysql#pooling-connections

const pool = mysql.createPool({
        connectionLimit: 100,
        host: 'esde-ca1.cukxmrlijhch.us-east-1.rds.amazonaws.com',
        user: 'admin',
        password: 'admin1234',
        // database: '',
        multipleStatements: true
});

module.exports = pool;

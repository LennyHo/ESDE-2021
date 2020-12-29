const config = require('../config/config');
const pool = require('../config/database');
const validation = require('../validationFn/jsonwebtoken');
module.exports.createUser = (fullname, email, password) => {
    console.log(fullname, email, password);
    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            } else {
                connection.query('INSERT INTO user ( fullname, email, user_password, role_id) VALUES (?,?,?,2) ', [fullname, email, password], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of createUser

module.exports.updateUser = (recordId, newRoleId) => {

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            } else {
                connection.query(`UPDATE user SET role_id =${newRoleId} WHERE user_id=${recordId}`, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of updateUser

module.exports.getUserData = (pageNumber, search) => {
    console.log('getUserData method is called.');
    const page = pageNumber;
    if (search == null) { search = ''; };
    const limit = 4; //Due to lack of test files, I have set a 3 instead of larger number such as 10 records per page
    const offset = (page - 1) * limit;

    //If the user did not provide any search text, the search variable
    //should be null. The following console.log should output undefined.
    //console.log(search);
    //-------------- Code which does not use stored procedure -----------
    //Query for fetching data with page number, search text and offset value
    if ((search == '') || (search == null)) {
        console.log('Prepare query without search text');
        userDataQuery = `SELECT user_id, fullname, email, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id LIMIT ${limit} OFFSET ${offset};
        SET @total_records =(SELECT count(user_id) FROM user    );SELECT @total_records total_records; `;
    }
    else {
        userDataQuery = `SELECT user_id, fullname, email, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id AND fullname LIKE '%${search}%'  LIMIT ${limit} OFFSET ${offset};
    SET @total_records =(SELECT count(user_id) FROM user WHERE fullname LIKE '%${search}%' );SELECT @total_records total_records;`;
    }

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            } else {

                connection.query(userDataQuery, [search, offset, limit], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Accessing total number of rows : ', results[2][0].total_records);
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getUserData

module.exports.getOneUserData = function (recordId) {
    console.log('getOneUserData method is called.');
    console.log('Prepare query to fetch one user record');
    userDataQuery = `SELECT user_id, fullname, email, user.role_id, role_name 
        FROM user INNER JOIN role ON user.role_id = role.role_id WHERE user_id=` + recordId;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            } else {
                connection.query(userDataQuery, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of getOneUserData

module.exports.getOneDesignData = function (recordId) {
    console.log('getOneDesignData method is called.');
    console.log('Prepare query to fetch one design record');

    userDataQuery = `SELECT created_by_id,file_id,cloudinary_file_id,cloudinary_url,design_title,design_description 
        FROM competition_system_security_concept_db.file WHERE file_id = ?`;

    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            } else {
                connection.query(userDataQuery, [recordId], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(results);
                        resolve(results);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation
} //End of getOneDesignData

module.exports.updateDesign = (data) => {
    return new Promise((resolve, reject) => {
        //I referred to https://www.codota.com/code/javascript/functions/mysql/Pool/getConnection
        //to prepare the following code pattern which does not use callback technique (uses Promise technique)
        pool.getConnection((err, connection) => {
            if (err) {
                console.log('Database connection error ', err);
                resolve(err);
            }
            else {

                var sql = `UPDATE competition_system_security_concept_db.file SET design_title = ?,
                 design_description = ? WHERE file_id = ?`;

                var values = [
                    data.design_title,
                    data.design_description,
                    data.file_id
                ]

                console.log("sucessfully added");
                // title: `${req.body.title}`, description: `${req.body.description}`, recordId: `${req.body.recordId}`

                connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log("sucessfully added 100%");
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    }); //End of new Promise object creation

} //End of updateDesign
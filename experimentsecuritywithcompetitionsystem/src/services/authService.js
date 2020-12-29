config = require('../config/config');
const pool = require('../config/database')

module.exports.authenticate = (email, callback) => {

    pool.getConnection((err, connection) => {
        if (err) {
            console.error("user has failed to log in");
        }
        else {
            try {
                connection.query(`SELECT user.user_id, fullname, email, user_password, role_name, user.role_id FROM user INNER JOIN role ON user.role_id=role.role_id AND email='${email}'`, {}, (err, results) => {
                    if (err) {
                        if (err) return callback(err, null);
                    }
                    else {
                        if (results.length == 1) {
                            console.log(results);
                            return callback(null, results);
                        }
                        else {
                            return callback('Login has failed', null);
                        }
                    }
                    connection.release();

                });
            }
            catch (error) {
                return callback(error, null);;
            }
        }
    }); //End of getConnection

} //End of authenticate
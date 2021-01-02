const user = require('../services/userService');
const auth = require('../services/authService');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const filter = require('../filter/filterFunctions');
const pool = require('../config/database')
const { RateLimiterMySQL } = require('rate-limiter-flexible');

const maxWrongAttemptsByIPperDay = 10;
const maxConsecutiveFailsByUsernameAndIP = 3;

const limiterSlowBruteByIP = new RateLimiterMySQL({

    storeClient: pool,
    dbName: 'rtlmtrflx',
    tableName: 'login_fail_ip_per_day',
    tableCreated: true,
    points: maxWrongAttemptsByIPperDay, // 10 requests
    duration: 60 * 60 * 24, // per 1 day by IP
    blockDuration: 60 * 15//60 * 60 * 24  Block for 15 mins, if 10 wrong attempts per day

});

const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterMySQL({

    storeClient: pool,
    dbName: 'rtlmtrflx',
    tableName: 'login_fail_consecutive_username_and_ip',
    tableCreated: true,
    points: maxConsecutiveFailsByUsernameAndIP, // 3 requests
    duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
    blockDuration: 60 * 5 // Block for 5 minutes

});

const getUsernameIPkey = (username, ip) => `${username}_${ip}`;

exports.processLogin = async (req, res, next) => {

    try {
        var date = new Date();

        // credentials
        let ipAddr = req.ip;
        var email = req.body.email;
        var password = req.body.password;

        console.log(date + '[' + ipAddr + ']' + " User is attempting to login.");
        console.log(date + '[' + ipAddr + ']' + " User is entering the email: " + email);
        console.log(date + '[' + ipAddr + ']' + " User is entering the password: " + password);


        const usernameIPkey = getUsernameIPkey(email, ipAddr);

        const [resUsernameAndIP, resSlowByIP] = await Promise.all([
            limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
            limiterSlowBruteByIP.get(ipAddr),
        ]);

        let retrySecs = 0;

        // Check if IP or Username + IP is already blocked
        if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {

            retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;

        } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {

            retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;

        }

        if (retrySecs > 0) {
            // If IP or Username + IP is already blocked send status 429
            date = new Date();
            console.log(date + '[' + ipAddr + ']' + " User email is already blocked.");//might have to change
            res.set('Retry-After', String(retrySecs));
            res.status(429).send('Too Many Requests');//might have to change
        }
        else {
            // If not yet blocked authenticate login
            var date = new Date();
            console.log(date + '[' + ipAddr + ']' + " going through authenticate");

            auth.authenticate(email, async function (error, results) {

                console.log(date + '[' + ipAddr + ']' + " authenticate complete");

                if (error) {
                    try {
                        // let message = 'Credentials are not valid.';
                        date = new Date();
                        // For the console log to work just add if result != null beforehand
                        console.error(date + "User's email has failed to login.");
                        const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                        await Promise.all(promises);
                        return res.status(500).json({ message: error });

                    } catch (rlRejected) {

                        if (rlRejected instanceof Error) {
                            console.log("Error with limiter"); //if there is an error
                            throw rlRejected;

                        } else {
                            date = new Date();
                            console.log(date + '[' + ipAddr + ']' + " User IP is blocked"); //user ip is blocked
                            res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
                            res.status(429).send('Too Many Requests');//might have to change
                        }
                    }
                }
                else {
                    if (results.length === 1) {
                        date = new Date();

                        if ((password[0] == null) || (results[0] == null)) {
                            try {
                                // Consume 1 point from limiters on wrong attempt and block if limits reached
                                const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                                // Count failed attempts by Username + IP only for registered users
                                promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
                                console.error(date + '[' + ipAddr + ']' + 'A user password has failed to login because the password is empty.');
                                return res.status(500).json({ message: 'login failed' });
                            }
                            catch (rlRejected) {
                                if (rlRejected instanceof Error) {
                                    console.log("Error with limiter"); //if there is an error
                                    throw rlRejected;

                                } else {
                                    date = new Date();
                                    console.log(date + '[' + results[0].user_id + ']' + ipAddr + " User Email is blocked"); //user email is blocked
                                    res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
                                    res.status(429).send('Too Many Requests');//might have to change
                                }
                            }
                        }//End of checking if there are returned SQL results

                        if (bcrypt.compareSync(password, results[0].user_password) == true) {

                            // console.log(date + "The password is comparing with bcrypt.");

                            if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
                                // Reset on successful authorisation
                                await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
                            }

                            let data = {
                                user_id: results[0].user_id,
                                role_name: results[0].role_name,
                                token: jwt.sign({ id: results[0].user_id }, config.JWTKey, {
                                    expiresIn: 86400 //Expires in 24 hrs
                                })
                            }; //End of data variable setup

                            // to display the log
                            console.log(date + ' User [' + results[0].user_id + ']' + '[' + ipAddr + ']' + " has offically logged in");

                            return res.status(200).json(data);

                        }
                        else {
                            try {
                                console.log(date + '[' + results[0].user_id + '] ' + '[' + ipAddr + ']' + " User key in an invalid password.");
                                // Consume 1 point from limiters on wrong attempt and block if limits reached
                                const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                                // Count failed attempts by Username + IP only for registered users
                                promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
                                await Promise.all(promises);
                                // return res.status(500).json({ message: 'Login has failed.' });
                                return res.status(500).json({ message: error });
                            } catch (rlRejected) {
                                if (rlRejected instanceof Error) {
                                    console.log("Error with limiter");
                                    throw rlRejected;
                                } else {
                                    date = new Date();
                                    console.log(date + '[' + results[0].user_id + '] ' + '[' + ipAddr + ']' + " User Email is blocked");
                                    res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
                                    res.status(429).send('Too Many Requests');
                                }
                            }
                        }//End of passowrd comparison with the retrieved decoded password.
                    }
                }

            });
        }

    } catch (error) {
        return res.status(500).json({ message: error });
    } //end of try
};

// If user submitted data, run the code in below
exports.processRegister = (req, res, next) => {
    console.log('processRegister running');
    let fullName = req.body.fullName;
    let email = req.body.email;
    let password = req.body.password;


    bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
            console.log("welp");
            console.log('Error on hashing password');
            return res.status(500).json({ message: 'Unable to complete registration' });
        }
        else {
            try {
                var results = await user.createUser(fullName, email, hash);
                filter.sanitizeResult(results);
                // console.log(results);
                return res.status(200).json({ message: 'Completed registration' });
            } catch (error) {
                console.log('processRegister method : catch block section code is running');
                console.log(error, '=======================================================================');
                return res.status(500).json({ message: 'Unable to complete registration' });
            }
        }
    });


}; //End of processRegister


                //return res.status(500).json({ message: message });
                //If the following statement replaces the above statement
                //to return a JSON response to the client, the SQLMap or
                //any attacker (who relies on the error) will be very happy
                //because they relies a lot on SQL error for designing how to do 
                //attack and anticipate how much "rewards" after the effort.
                //Rewards such as sabotage (seriously damage the data in database), 
                //data theft (grab and sell). 
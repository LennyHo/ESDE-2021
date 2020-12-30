const user = require('../services/userService');
const auth = require('../services/authService');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const filter = require('../filter/filterFunctions');

exports.processLogin = (req, res, next) => {

    try {
        console.log("test authenticating the user credentials.");

        var email = req.body.email;
        var password = req.body.password;

        if (email == "") {

            var date = new Date();
            console.log(date + "User has not key in the email.");

        } else if (password == "") {

            date = new Date();
            console.log(date + "User did not fill in the password.");
            
        }
        else {

            console.log("going through authenticate");

            auth.authenticate(email, function (error, results) {

                console.log("authenticate complete");

                if (error) {
                    let message = 'Credentials are not valid.';
                    var date = new Date();
                    // For the console log to work just add if result != null beforehand
                    console.error(date + 'User has failed to login.');
                    return res.status(500).json({ message: message });
                }
                else {
                    if (results.length === 1) {
                        date = new Date();
                        // console.log(results);

                        if (bcrypt.compareSync(password, results[0].user_password) == true) {

                            // console.log(date + "The password is comparing with bcrypt.");

                            let data = {
                                user_id: results[0].user_id,
                                role_name: results[0].role_name,
                                token: jwt.sign({ id: results[0].user_id }, config.JWTKey, {
                                    expiresIn: 86400 //Expires in 24 hrs
                                })
                            }; //End of data variable setup

                            // to display the log
                            // console.log(date + "The password has sucessfully compared.");
                            console.log(date + ' User [' + results[0].user_id + ']' + " has offically logged in");

                            return res.status(200).json(data);

                        }
                        else {
                            // return res.status(500).json({ message: 'Login has failed.' });
                            return res.status(500).json({ message: error });
                        } //End of passowrd comparison with the retrieved decoded password.


                    }
                    else {
                        if ((password[0] === null) || (results[0] === null)) {

                            console.error(date + 'A user has failed to login');
                            return res.status(500).json({ message: 'login failed' });
                        }
                    }
                    //End of checking if there are returned SQL results
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
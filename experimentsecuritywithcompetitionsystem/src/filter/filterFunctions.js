const validator = require('validator');

var filter = {
    validationRegister: function (req, res, next) {

        var userName = req.body.fullName;
        var userEmail = req.body.email;
        var userPassword = req.body.password;
        console.log('test 1');

        var reName = new RegExp(`^[a-zA-Z\s,']+$`);

        var reEmail = new RegExp(`^[a-zA-Z0-9]+@[a-zA-Z?!]+\.com$`);

        var rePassword = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,}$`);

        // validator.isEmail(userEmail)
        if (reName.test(userName) && reEmail.test(userEmail) && rePassword.test(userPassword)) {
            next();
        }
        else {
            res.status(500);
            res.send(`{"Message":"it is invalid. Please try again."}`);
        }
    },

    updateFileValidation: function (req, res, next) {

        var designTitle = req.body.designTitle;
        var designDescription = req.body.designDescription;

        console.log('test 1');

        var reDesignTitle = new RegExp(`^[A-Za-z?0-9]+$`);

        var reDesignDescription = new RegExp(`^[A-Za-z?0-9]+$`);

        console.log("finish regex");
        if (reDesignTitle.test(designTitle) && reDesignDescription.test(designDescription)) {
            console.log("finish testing");
            next();
        }

        else {
            res.status(500);
            console.log("regex error");
            res.send(`{"Message":"it is invalid. Please try again."}`);
        }
    },

    sanitizeResult: function (result) {
        for (var i = 0; i < result.length; i++) {

            var row = result[i];

            for (var value in row) {

                var val = row[value];
                if (typeof val === "string") {
                    row[value] = validator.escape(val);
                }
            }
        }

    }

}

module.exports = filter;
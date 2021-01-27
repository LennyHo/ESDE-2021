// 
var
    AWS = require("aws-sdk"),
    S3API = new AWS.S3({
        apiVersion: "2006-03-01",
        region: "us-east-1"
    });


// create the name of the bucket
(function createBucket() {
    var
        params = {
            //USE YOUR BUCKET NAME HERE
            Bucket: "designcompeitionwebsite",
        };
    S3API.createBucket(params, function(error, data) {
        console.log(error, data);
    });
})();


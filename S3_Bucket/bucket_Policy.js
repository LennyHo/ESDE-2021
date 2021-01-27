var
    AWS = require("aws-sdk"),
    S3API = new AWS.S3({
        apiVersion: "2006-03-01",
        region: "us-east-1"
    })
    , PUBLIC_POLICY_STR = JSON.stringify(require("./public_policy.json"));

(function addPublicBucketPolicy(){
    var
        params = {
            Bucket: "designcompeitionwebsite",
            Policy: PUBLIC_POLICY_STR

        };
        
        S3API.putBucketPolicy(params, function(error, data){
            console.log(error, data);
        });
})();

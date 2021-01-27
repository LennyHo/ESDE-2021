var
    AWS = require("aws-sdk"),
    S3API = new AWS.S3({
        apiVersion: "2006-03-01",
        region: "us-east-1"
    }),
    FS = require("fs"),
    bucket_name_str = "<FMI>";


function uploadItemAsBinary(key_name_str, content_type_str, bin){
    var params = {
        Bucket: bucket_name_str,
        Key: key_name_str,
        Body: bin,
        ContentType: content_type_str,
        CacheControl: "max-age=0"
    };
    S3API.putObject(params, function(error, data){
        console.log(error, data);
    });
}

(function init(){
    var cat_pic_bin = FS.readFileSync("../cat.jpg");
    uploadItemAsBinary("cat.jpg", "image/jpg", cat_pic_bin);
    var index_page_bin = FS.readFileSync("../index.html");
    uploadItemAsBinary("index.html", "text/html", index_page_bin);
})();


const bunyan = require('bunyan');
const path = require('path');
var jwt = require('jsonwebtoken');
const os = require('os');

const fs = require("fs");
//const fs= require(path.join(global.__utilPath, 'fileUtils'));
const color = require("./color");

var log_dir_path ="e:\logs"


pathExists(log_dir_path, 777, function(err) {
    if (err) {
        console.log(color.red("There has been an error trying to Create the Log Dir."));
        process.exit();
    }

});


module.exports = bunyan.createLogger({
    name: "earp",

    streams: [{
        stream: process.stdout,
        level: 'info'
    },
    {
        path: `${path.join(log_dir_path, 'earp.log')}`,
        level: 'info',
    },
    {
        path: `${path.join(log_dir_path,  'earp.log')}`,
        level: 'error'
    }
    ]
});

/* The following function has been created temporarily to show where the log files are being saved. Change back to 
mkdirSync in fileUtils when tested. 
*/

function pathExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }

    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') {
                console.log(color.cyan("Using existing logs directory [" + path+ "]"));
                cb(null); }
                // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else {
            console.log("Created logs directory [" + path+ "] successfully.");
            cb(null); // successfully created folder
        }
    });
}
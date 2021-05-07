/**
 * Starts file  System watcher and test the validity of uploaded files
 * @module Test Files Server
 * @author Mario Galea
 * @version 1.0
 * @copyright Random Systems International
 */
const path = require('path');
const fs = require('fs');
const fsWatcher = require('chokidar');
const FileInfo = require('./classes/FileInfo');

const log = require("./utils/logUtils");

var dbProcessing=true;

fsWatcher.watch('uploads', { //Bogus file to start the watcher before the Database is connected
    ignored: /(^|[\/\\])\../,
    persistent: true,
    alwaysState: true,
    usePolling: false,
    interval: 100,
    binaryInterval: 300,
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
    },
    ignorePermissionErrors: false,
})
    .on('ready', function () {
        log.info('File Server ready.');
    })
    .on('unlink', function (filePath) {
        log.info(path.basename(filePath), ' has been deleted');
    })
    .on('change', function (filePath) {
        log.info(filePath, ' has been changed');
        processFile(filePath);
    })
    .on('rename', function (filePath) {
        log.info(filePath, ' has been renamed');
        processFile(filePath);
    })
    .on('error', function (error) {
        log.info('File watcher error: ', error);
    })
    .on('add', (filePath) => {
        log.info(path.basename(filePath), ' has been added');
        processFile(filePath);
    });

/*
    Process File for validity before Archiving
*/
function processFile(filePath) {

    if (dbProcessing == true) {
        var fileInfo = new FileInfo(filePath, { isFilePath: true });
        if (fileInfo.valid === true) {

            fileServer(fileInfo);
        }
        else {
            fileInfo.message = 'Invalid Filename';
            fileDelete(fileInfo);
        }
    }
}

function fileServer(filePath){
const reports = require('./reports.json');
    for (var counter in reports) {
        console.log(reports[counter].name + " with extension: " + reports[counter].filename.ext);
    }
}

function fileArchive(fileInfo) {
    var filename = fileInfo.filename;
    log.info((typeof fileInfo.message == 'object') ?
        fileInfo.message
        : { filename }, (typeof fileInfo.message == 'object') ?
        'accepted'
        : 'accepted: ' + fileInfo.message);
    if (LogFile) {
        new LogFile().create(fileInfo);
    }
}

function fileDelete(fileInfo) {
    var filename = fileInfo.filename;
    log.info((typeof fileInfo.message == 'object') ?
        fileInfo.message
        : { filename }, (typeof fileInfo.message == 'object') ?
        'rejected'
        : 'rejected: ' + fileInfo.message);
    if (LogFile) {
        new LogFile().create(fileInfo);
    }
    try {
        if (fs.existsSync(fileInfo.filepath)) {
            fs.unlinkSync(fileInfo.filepath);
        }
    } catch (err) {
        console.error(err)
    }


}


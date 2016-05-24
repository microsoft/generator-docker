/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var fs = require('fs');
var DockerfileHelper = require('./dockerfileHelper.js');
var DockerComposeHelper = require('./dockerComposeHelper.js');

/**
 * Represents a helper for ASP.NET projects.
 * @constructor
 * @param {string} imageName - ASP.NET version to use.
 * @param {int} portNumber - Port number.
 * @param {string} imageName - App image name.
 */
var AspNetHelper = function (baseImageName, portNumber, imageName) {
    this._baseImageName = baseImageName;
    this._portNumber = portNumber;
    this._imageName = imageName;
}

/**
 * Creates dockerfile contents.
 * @returns {string}
 */
AspNetHelper.prototype.createDockerfile = function (isDebug) {
    var _dockerfileHelper = new DockerfileHelper();
    _dockerfileHelper.addFromCommand(this.getDockerImageName());
    _dockerfileHelper.addCopyCommand('project.json /app/');
    _dockerfileHelper.addWorkdirCommand('/app');
    if (this._baseImageName === 'dotnet:1.0.0-preview1' ) {
        _dockerfileHelper.addRunCommand('["dotnet", "restore"]');
    } else {
        _dockerfileHelper.addRunCommand('["dnu", "restore"]');
    }
    _dockerfileHelper.addCopyCommand('. /app');
    if (this._baseImageName === 'dotnet:1.0.0-preview1' ) {
        _dockerfileHelper.addRunCommand('["dotnet", "build", "-c", ' + (isDebug ? '"Debug"' : '"Release"') + ']');
    }
    _dockerfileHelper.addExposeCommand(this.getPortNumber());
    if (this._baseImageName === 'dotnet:1.0.0-preview1' ) {
        _dockerfileHelper.addEntrypointCommand('["dotnet", "run"]');
    } else {
        _dockerfileHelper.addEntrypointCommand('["dnx", "-p", "project.json", "web"]');
    }

    return _dockerfileHelper.createDockerfileContents();
}

/**
 * Creates dockerIgnore contents.
 * @returns {string}
 */
AspNetHelper.prototype.createDockerignoreFile = function () {
    return 'project.lock.json';
}

/**
 * Creates docker-compose file contents.
 * @returns {string}
*/
AspNetHelper.prototype.createDockerComposeFile = function (isDebug) {
    var _dockerComposeHelper = new DockerComposeHelper();
    _dockerComposeHelper.addAppName(this._imageName);

    if (isDebug) {
        _dockerComposeHelper.addDockerfile('Dockerfile.debug');
    } else {
        _dockerComposeHelper.addDockerfile('Dockerfile.release');
    }

    _dockerComposeHelper.addBuildContext('.');
    _dockerComposeHelper.addPort(this._portNumber + ':' + this._portNumber);

    if (isDebug) {
        _dockerComposeHelper.addLabel('com.' + this._imageName + '.environment: "debug"');
    } else {
        _dockerComposeHelper.addLabel('com.' + this._imageName + '.environment: "release"');
    }

    return _dockerComposeHelper.createContents();
}

/**
 * Gets the Docker image name.
 * @returns {string}
 */
AspNetHelper.prototype.getDockerImageName = function () {
    return 'microsoft/' + this._baseImageName;
}

/**
 * Gets the port number.
 * @returns {int}
 */
AspNetHelper.prototype.getPortNumber = function () {
    return this._portNumber;
}

/**
 * Gets the app image name.
 * @returns {string}
 */
AspNetHelper.prototype.getImageName = function () {
    return this._imageName;
}

/**
 * Creates a backup of a file.
 * @param {string} sourceFile - Source file.
 * @param {string} targetFile - Target file.
 */
AspNetHelper.prototype._backupFile = function (sourceFile, targetFile) {
    fs.readFile(sourceFile, 'utf8', function (err, data) {
        if (err) {
            console.log('Error reading file: ' + err);
            return;
        }
        fs.writeFile(targetFile, data);
    });
}

/**
 * Checks if  'web' command is in the  project.json and adds it if command is not there yet.
 * @returns {string}
 */
AspNetHelper.prototype.configureUrls = function (cb) {
    if (this._baseImageName === 'dotnet:1.0.0-preview1' ) {
        var rootFolder = process.cwd() + path.sep;
        var fileName = rootFolder + 'Program.cs';
        var backupFile = rootFolder + 'Program.cs.backup';
        var port = this._portNumber;
        var self = this;
        fs.readFile(fileName, 'utf8', function (err, data) {
            if (err) {
                cb(new Error('Can\'t read Program.cs file. Make sure Program.cs file exists.'));
                return;
            }
            
            if (data.indexOf('.UseUrls(' < 0)) {
                self._backupFile(fileName, backupFile);
                data = data.replace('new WebHostBuilder()', 'new WebHostBuilder().UseUrls("http://*:' + port + '")');
                fs.writeFile(fileName, data, function (err) {
                    if (err) {
                        cb(new Error('Can\'t write to Program.cs file.'));
                        return;
                    }
                    cb(null, 'We noticed your Program.cs file didn\'t call UseUrls. We\'ve fixed that for you.');
                    return;
                });
                return;
            }
            cb(null, null);
            return;
        });
    } else {
        var rootFolder = process.cwd() + path.sep;
        var fileName = rootFolder + 'project.json';
        var backupFile = rootFolder + 'project.json.backup';
        var port = this._portNumber;
        var self = this;
        fs.readFile(fileName, 'utf8', function (err, data) {
            if (err) {
                cb(new Error('Can\'t read project.json file. Make sure project.json file exists.'));
                return;
            }

            // Remove BOM.
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.replace(/^\uFEFF/, '');
            }

            data = JSON.parse(data);

            if (data.commands.web === undefined) {
                self._backupFile(fileName, backupFile);
                data.commands.web = 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:' + port;
                fs.writeFile(fileName, JSON.stringify(data), function (err) {
                    if (err) {
                        cb(new Error('Can\'t write to project.json file.'));
                        return;
                    }
                    cb(null, 'We noticed your project.json file didn\'t know how to start the kestrel web server. We\'ve fixed that for you.');
                    return;
                });
                return;
            }
            cb(null, null);
            return;
        });
    }
}

/**
 * Gets the template script name.
 * @returns {string}
 */
AspNetHelper.prototype.getTemplateScriptName = function () {
    return util.isWindows() ? '_dockerTaskGeneric.ps1' : '_dockerTaskGeneric.sh';
}

module.exports = AspNetHelper;

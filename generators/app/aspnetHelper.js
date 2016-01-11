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
 * @param {string} aspNetVersion - ASP.NET version to use.
 * @param {int} portNumber - Port number.
 * @param {string} imageName - App image name.
 */
var AspNetHelper = function (aspNetVersion, portNumber, imageName) {
    this._aspNetVersion = aspNetVersion;
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
    _dockerfileHelper.addRunCommand('["dnu", "restore"]');
    _dockerfileHelper.addCopyCommand('. /app');
    _dockerfileHelper.addExposeCommand(this.getPortNumber());
    _dockerfileHelper.addEntrypointCommand('["dnx", "-p", "project.json", "web"]');

    return _dockerfileHelper.createDockerfileContents();
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
    // Note: 1.0.0-rc1-update1 tag is used to provide
    // updated RC1 runtime with backward support of rc1-final
    // See updated release blog on MSDN:
    // http://blogs.msdn.com/b/webdev/archive/2015/11/18/announcing-asp-net-5-release-candidate-1.aspx
    // https://github.com/aspnet/aspnet-docker/pull/120
    if(this._aspNetVersion === '1.0.0-rc1-final') {
        return 'microsoft/aspnet:1.0.0-rc1-update1';
    }
    return 'microsoft/aspnet:' + this._aspNetVersion;
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
 * @returns {boolean}
 */
AspNetHelper.prototype.addWebCommand = function (cb) {
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
                cb(null, true);
                return;
            });
        }
        cb(null, false);
        return;
    });
}

/**
 * Gets the template script name.
 * @returns {string}
 */
AspNetHelper.prototype.getTemplateScriptName = function () {
    return util.isWindows() ? '_dockerTaskGeneric.ps1' : '_dockerTaskGeneric.sh';
}

module.exports = AspNetHelper;

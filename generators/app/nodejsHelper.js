/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var DockerfileHelper = require('./dockerfileHelper.js');
var DockerComposeHelper = require('./dockerComposeHelper.js');

/**
 * Represents a helper for Node.js projects.
 * @constructor
 * @param {int} portNumber - Port number.
 * @param {string} imageName - App image name.
 */
var NodejsHelper = function (portNumber, imageName) {
    this._portNumber = portNumber;
    this._imageName = imageName;
}

/**
 * Creates dockerfile contents.
 * @returns {string}
 */
NodejsHelper.prototype.createDockerfile = function (isDebug) {
    var _dockerfileHelper = new DockerfileHelper();
    _dockerfileHelper.addFromCommand(this.getDockerImageName());
    _dockerfileHelper.addRunCommand('mkdir /src');
    _dockerfileHelper.addCopyCommand('. /src');
    _dockerfileHelper.addWorkdirCommand('/src');
    _dockerfileHelper.addExposeCommand(this._portNumber);

    if (isDebug) {
        _dockerfileHelper.addRunCommand('npm install nodemon -g');
    }

    _dockerfileHelper.addRunCommand('npm install');

    if (isDebug) {
        _dockerfileHelper.addCmdCommand('["nodemon"]');
    } else {
        _dockerfileHelper.addCmdCommand('["node", "./bin/www"]');
    }

    return _dockerfileHelper.createDockerfileContents();
}

/**
 * Creates docker-compose file contents.
 * @returns {string}
*/
NodejsHelper.prototype.createDockerComposeFile = function (isDebug) {
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
        _dockerComposeHelper.addVolume('.:/src');
    }

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
NodejsHelper.prototype.getDockerImageName = function () {
    return 'node';
}

/**
 * Gets the template script name.
 * @returns {string}
 */
NodejsHelper.prototype.getTemplateScriptName = function () {
    return util.isWindows() ? '_dockerTaskGeneric.ps1' : '_dockerTaskGeneric.sh';
}

/**
 * Gets the parameter for volume sharing used in the docker run command.
 * @returns {string}
 */
NodejsHelper.prototype._getVolumeShareParameter = function () {
    // Use for volume sharing in Windows.
    var sourcePath = '/' + process.cwd().replace(/\\/g, '/').replace(/:/g, '');
    return util.isWindows() ? '-v ' + sourcePath + ':/src' : '-v `pwd`:/src';
}

/**
 * Gets the value indicating whether -v parameter can be used in the docker run command.
 * For volume sharing on Windows, project has to be under %HOMEDRIVE%\Users\ folder.
 * @returns {boolean}
 */
NodejsHelper.prototype.canShareVolume = function () {
    if (util.isWindows()) {
        var splitFolders = process.cwd().split(path.sep);
        var rootFolder = splitFolders[0] + path.sep + splitFolders[1];

        if (rootFolder.toLowerCase() != process.env.HOMEDRIVE.toLowerCase() + path.sep + 'users') {
            return false;
        }
    }

    return true;
}

module.exports = NodejsHelper;
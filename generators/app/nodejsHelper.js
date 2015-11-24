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
 * @param {boolean} useNodemon - True if Nodemon should be used, false otherwise.
 * @param {int} portNumber - Port number.
 * @param {string} imageName - App image name.
 */
var NodejsHelper = function(useNodemon, portNumber, imageName) {
    this._useNodemon = useNodemon;
    this._portNumber = portNumber;
    this._imageName = imageName;
}

/**
 * Creates dockerfile contents.
 * @returns {string}
 */
NodejsHelper.prototype.createDockerfile = function() {
    var _dockerfileHelper = new DockerfileHelper();
    _dockerfileHelper.addFromCommand(this.getDockerImageName());
    _dockerfileHelper.addRunCommand('mkdir /src');
    _dockerfileHelper.addAddCommand('. /src');
    _dockerfileHelper.addWorkdirCommand('/src');
    _dockerfileHelper.addExposeCommand(this._portNumber);

    if (this._useNodemon) {
        _dockerfileHelper.addRunCommand('npm install nodemon -g');
    }

    _dockerfileHelper.addRunCommand('npm install');
    
    if (this._useNodemon) {
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
NodejsHelper.prototype.createDockerComposeFile = function() {
    var _dockerComposeHelper = new DockerComposeHelper();
    _dockerComposeHelper.addAppName(this._imageName);
    _dockerComposeHelper.addDockerfile('Dockerfile');
    _dockerComposeHelper.addBuildContext('.');
    _dockerComposeHelper.addPort(this._portNumber + ':' + this._portNumber);

    if (this._useNodemon) {
        if (util.isWindows()) {
            var sourcePath = '/' + process.cwd().replace(path.sep, '/');
            _dockerComposeHelper.addVolume(sourcePath + ':/src');
        } else {
            _dockerComposeHelper.addVolume('.:/src');
        }
    }

    return _dockerComposeHelper.createContents();
}

/**
 * Gets the Docker image name.
 * @returns {string}
 */
NodejsHelper.prototype.getDockerImageName = function() {
    return 'node';
}

/**
 * Gets the template script name.
 * @returns {string}
 */
NodejsHelper.prototype.getTemplateScriptName = function() {
    return util.isWindows() ? '_dockerTaskGeneric.cmd' : '_dockerTaskGeneric.sh';
}

/**
 * Gets the parameter for volume sharing used in the docker run command.
 * @returns {string}
 */
NodejsHelper.prototype._getVolumeShareParameter = function() {
    // Use for volume sharing in Windows.
    var sourcePath = '/' + process.cwd().replace(path.sep, '/');
    return util.isWindows() ? '-v ' + sourcePath + ':/src' : '-v `pwd`:/src';
}

/**
 * Gets the port parameter to be used in the docker run command.
 * @returns {string}
 */
NodejsHelper.prototype._getPortParameter = function() {
    return '-p ' + util.scriptify('publicPort') + ':' + util.scriptify('containerPort');
}

/**
 * Gets the value indicating whether -v parameter can be used in the docker run command.
 * For volume sharing on Windows, project has to be under %HOMEDRIVE%\Users\ folder.
 * @returns {boolean}
 */
NodejsHelper.prototype.canShareVolume = function() {
    if (util.isWindows() && this._useNodemon) {
        var splitFolders = process.cwd().split(path.sep);
        var rootFolder = splitFolders[0] + path.sep + splitFolders[1];
        
        if (rootFolder.toLowerCase() != process.env.HOMEDRIVE.toLowerCase() + path.sep + 'users') {
            return false;
        }
    }

    return true;
}

/**
 * Gets the command for running the docker container.
 * @returns {string}
 */
NodejsHelper.prototype.getContainerRunCommand = function() {
    return this._useNodemon ?
        'docker run -di ' + this._getPortParameter() + ' ' + this._getVolumeShareParameter() + ' ' + util.scriptify('imageName') :
        'docker run -di ' + this._getPortParameter() + ' ' + util.scriptify('imageName');;
}

module.exports = NodejsHelper;
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
 * Represents a helper for Golang projects.
 * @constructor
 * @param {boolean} isWeb - True if Go project is a web project, false otherwise.
 * @param {int} portNumber - Port number.
 * @param {string} imageName - App image name.
 */
var GolangHelper = function(isWeb, portNumber, imageName) {
    this._isWeb = isWeb;
    this._portNumber = portNumber;
    this._imageName = imageName;
}

/**
 * Creates dockerfile contents.
 * @returns {string}
 */
GolangHelper.prototype.createDockerfile = function() {
    var projectName = this.getProjectName();
    var _dockerfileHelper = new DockerfileHelper();
    _dockerfileHelper.addFromCommand(this.getDockerImageName());
    _dockerfileHelper.addAddCommand('. /go/src/github.com/' + projectName);
    _dockerfileHelper.addRunCommand('go install github.com/' + projectName);
    _dockerfileHelper.addEntrypointCommand('/go/bin/' + projectName);

    return _dockerfileHelper.createDockerfileContents();
}

/**
 * Creates docker-compose file contents.
 * @returns {string}
*/
GolangHelper.prototype.createDockerComposeFile = function() {
    var _dockerComposeHelper = new DockerComposeHelper();
    _dockerComposeHelper.addAppName(this._imageName);
    _dockerComposeHelper.addDockerfile('Dockerfile');
    _dockerComposeHelper.addBuildContext('.');

    if (this._isWeb) {
        _dockerComposeHelper.addPort(this._portNumber + ':' + this._portNumber);
    }

    return _dockerComposeHelper.createContents();
}

/**
 * Gets the Docker image name.
 * @returns {string}
 */
GolangHelper.prototype.getDockerImageName = function() {
    return 'golang';
}

/**
 * Gets the port number.
 * @returns {int}
 */
GolangHelper.prototype.getPortNumber = function() {
    return this._portNumber;
}

/**
 * Gets the app image name.
 * @returns {string}
 */
GolangHelper.prototype.getImageName = function() {
    return this._imageName;
}

/**
 * Gets the template script name.
 * @returns {string}
 */
GolangHelper.prototype.getTemplateScriptName = function() {
    return util.isWindows() ? '_dockerTaskGolang.cmd' : '_dockerTaskGolang.sh';
}

/**
 * Gets the project name (this is used in the Dockerfile).
 * @returns {string}
 */
GolangHelper.prototype.getProjectName = function() {
    // Use the current folder name for project name.
    return process.cwd().split(path.sep).pop();
}

/**
 * Gets the command for opening the web site.
 * @returns {string}
 */
GolangHelper.prototype.getOpenWebSiteCommand = function() {
    var command = '';

    if (this._isWeb) {
        if (util.isWindows()) {
            command = 'FOR /F %%i IN (\' "docker-machine active" \') do set dockerHostName=%%i\
                      FOR /F %%i IN (\' "docker-machine ip %dockerHostName:"=%" \') do set tmpValue=%%i\
                       \r\n\t\tset ipValue=%tmpValue: =%\
                       \r\n\t\tstart http://%ipValue%:' + this._portNumber;
        } else {
            
             command = 'until $(curl --output /dev/null --silent --head --fail http://$(docker-machine ip $(docker-machine active)):' + this._portNumber + '); do\
                        \nprintf \'.\'\
                        \nsleep 1\
                        \ndone\
                        \nopen \"http://$(docker-machine ip $(docker-machine active)):' + this._portNumber + '\"';
        }
    }

    return command;
}

/**
 * Gets the command for running the docker container.
 * @returns {string}
 */
GolangHelper.prototype.getContainerRunCommand = function() {
    return this._isWeb ? 'docker run -di -p ' + this._portNumber + ':' + this._portNumber + ' ' + this._imageName :
        'docker run -di ' + this._imageName;
}

module.exports = GolangHelper;
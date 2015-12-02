/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

/**
 * Helper for creating dockerfile contents.
 * @constructor
 */
var DockerfileHelper = function () {
    this._commandMap = [];
}

/**
 * Adds the FROM [imagename] line.
*/
DockerfileHelper.prototype.addFromCommand = function (command) {
    this._addCommand('FROM', command);
}

/**
 * Adds the RUN [command] line.
*/
DockerfileHelper.prototype.addRunCommand = function (command) {
    this._addCommand('RUN', command);
}

/**
 * Adds COPY [command] line.
*/
DockerfileHelper.prototype.addCopyCommand = function (command) {
    this._addCommand('COPY', command);
}

/**
 * Adds WORKDIR [command] line.
*/
DockerfileHelper.prototype.addWorkdirCommand = function (command) {
    this._addCommand('WORKDIR', command);
}

DockerfileHelper.prototype.addExposeCommand = function (command) {
    this._addCommand('EXPOSE', command);
}

/**
 * Adds ENTRYPOINT [command] line.
*/
DockerfileHelper.prototype.addEntrypointCommand = function (command) {
    this._addCommand('ENTRYPOINT', command);
}

/**
 * Adds CMD [command] line.
*/
DockerfileHelper.prototype.addCmdCommand = function (command) {
    this._addCommand('CMD', command);
}

/**
 * Iterates through the array of commands and creates the contents.
*/
DockerfileHelper.prototype.createDockerfileContents = function () {
    var contents = '';
    for (var i = 0; i < this._commandMap.length; i++) {
        var item = this._commandMap[i];
        contents += item.commandName + ' ' + item.value + '\n';
    }

    return contents;
}

/**
 * Adds the command name and value to the list of commands.
*/
DockerfileHelper.prototype._addCommand = function (commandName, value) {
    this._commandMap.push({ commandName: commandName, value: value });
}

module.exports = DockerfileHelper;
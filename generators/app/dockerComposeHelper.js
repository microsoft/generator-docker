/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

/**
 * Helper for creating docker-compose file contents.
 * @constructor
 */
var DockerComposeHelper = function () {
    this._commandMap = [];
}

DockerComposeHelper.prototype.addAppName = function (name) {
    this._addCommand('', name);
}

DockerComposeHelper.prototype.addDockerfile = function (fileName) {
    this._addCommand('dockerfile', fileName);
}

DockerComposeHelper.prototype.addBuildContext = function (context) {
    this._addCommand('build', context);
}

DockerComposeHelper.prototype.addPort = function (ports) {
    this._addCommand('ports', ports);
}

DockerComposeHelper.prototype.addVolume = function (volume) {
    this._addCommand('volumes', volume);
}

DockerComposeHelper.prototype.addLabel = function (label) {
    this._addCommand('labels', label)
}

/**
 * Iterates through the array of commands and creates the contents.
*/
DockerComposeHelper.prototype.createContents = function () {
    var contents = '';

    for (var i = 0; i < this._commandMap.length; i++) {
        var item = this._commandMap[i];

        switch (item.commandName) {
            case '': {
                // [VALUE]:
                contents += item.value + ':\n';
                break;
            }

            case 'ports': {
                if (contents.indexOf(item.commandName) === -1) {
                    // Add 'ports:' first.
                    contents += '  ' + item.commandName + ':\n';
                }

                contents += '    - "' + item.value + '"\n';
                break;
            }
            case 'volumes': {
                if (contents.indexOf(item.commandName) === -1) {
                    // Add 'volumes:' first.
                    contents += '  ' + item.commandName + ':\n';
                }

                contents += '    - ' + item.value + '\n';
                break;
            }

            case 'labels': {
                if (contents.indexOf(item.commandName) === -1) {
                    contents += '  ' + item.commandName + ':\n';
                }

                contents += '    ' + item.value + '\n'
                break;
            }

            default: {
                // [COMMANDNAME]: [VALUE]
                contents += '  ' + item.commandName + ': ' + item.value + '\n';
                break;
            }
        }
    }

    return contents;
}

/**
 * Adds the command name and value to the list of commands.
*/
DockerComposeHelper.prototype._addCommand = function (commandName, value) {
    this._commandMap.push({ commandName: commandName, value: value });
}

module.exports = DockerComposeHelper;
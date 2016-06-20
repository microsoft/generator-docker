/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var BaseHelper = require('./baseHelper.js');

/**
 * Represents a helper for Node.js projects.
 * @constructor
 */
var NodejsHelper = function () {
}

/**
 * Inherit from BaseHelper
 */
NodejsHelper.prototype = Object.create(BaseHelper.prototype);

/**
 * Gets the template docker-compose file name.
 * @returns {string}
 */
NodejsHelper.prototype.getTemplateDockerComposeFileName = function () {
    return 'docker-compose.yml';
}

/**
 * Gets the template dockerfile name.
 * @returns {string}
 */
NodejsHelper.prototype.getTemplateDockerFileName = function () {
    return path.join('node', 'Dockerfile');
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
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var BaseHelper = require('./baseHelper.js');

/**
 * Represents a helper for Golang projects.
 * @constructor
 */
var GolangHelper = function () {
}

/**
 * Inherit from BaseHelper
 */
GolangHelper.prototype = Object.create(BaseHelper.prototype);

/**
 * Gets the Docker image name.
 * @returns {string}
 */
GolangHelper.prototype.getDockerImageName = function () {
    return 'golang';
}
/**
 * Gets the template docker-compose file name.
 * @returns {string}
 */
GolangHelper.prototype.getTemplateDockerComposeFileName = function () {
    return 'docker-compose.yml';
}

/**
 * Gets the template dockerfile name.
 * @returns {string}
 */
GolangHelper.prototype.getTemplateDockerFileName = function () {
    return path.join('go', 'Dockerfile');
}

/**
 * Gets the project name (this is used in the Dockerfile).
 * @returns {string}
 */
GolangHelper.prototype.getProjectName = function () {
    // Use the current folder name for project name.
    return process.cwd().split(path.sep).pop();
}

module.exports = GolangHelper;
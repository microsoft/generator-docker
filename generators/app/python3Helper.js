'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var BaseHelper = require('./baseHelper.js');

/**
 * Represents a helper for Python3 projects.
 * @constructor
 */
var Python3Helper = function () {
}

/**
 * Inherit from BaseHelper
 */
Python3Helper.prototype = Object.create(BaseHelper.prototype);

/**
 * Gets the Docker image name.
 * @returns {string}
 */
Python3Helper.prototype.getDockerImageName = function () {
    return 'python:3-onbuild';
}
/**
 * Gets the template docker-compose file name.
 * @returns {string}
 */
Python3Helper.prototype.getTemplateDockerComposeFileName = function () {
    return 'docker-compose.yml';
}

/**
 * Gets the template dockerfile name.
 * @returns {string}
 */
Python3Helper.prototype.getTemplateDockerFileName = function () {
    return path.join('python3', 'Dockerfile');
}

/**
 * Gets the project name (this is used in the Dockerfile).
 * @returns {string}
 */
Python3Helper.prototype.getProjectName = function () {
    // Use the current folder name for project name.
    return process.cwd().split(path.sep).pop();
}

module.exports = Python3Helper;
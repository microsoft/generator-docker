/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var fs = require('fs');

/**
 * Represents a helper for ASP.NET projects.
 * @constructor
 * @param {string} aspnetVersion - ASP.NET version to use.
 * @param {int} portNumber - Port number. 
 * @param {string} imageName - App image name. 
 */
var AspnetHelper = function(aspnetVersion, portNumber, imageName) {
    this._aspnetVersion = aspnetVersion;
    this._portNumber = portNumber;
    this._imageName = imageName;
}

/**
 * Gets the Docker image name. 
 * @returns {string}
 */
AspnetHelper.prototype.getDockerImageName = function() {
    return 'microsoft/aspnet:' + this._aspnetVersion;
}

/**
 * Gets the port number.
 * @returns {int}
 */
AspnetHelper.prototype.getPortNumber = function () {
    return this._portNumber;
}

/**
 * Gets the app image name.
 * @returns {string} 
 */
AspnetHelper.prototype.getImageName = function () {
    return this._imageName;
}

/** 
 * Creates a backup of a file. 
 * @param {string} sourceFile - Source file. 
 * @param {string} targetFile - Target file. 
 */
AspnetHelper.prototype._backupFile = function (sourceFile, targetFile) {
      fs.readFile(sourceFile, 'utf8', function(err, data) {
        if (err) {
            console.log('Error reading file: ' + err);
            return;
        }
        fs.writeFile(targetFile, data);
      });    
}

/**
 * Adds the 'kestrel' command to the project.json file if command is not there yet.
 */
AspnetHelper.prototype.addKestrelCommand = function () {
    var rootFolder = process.cwd() + path.sep;
    var fileName = rootFolder + 'project.json';
    var backupFile = rootFolder + 'project.json.backup';

    fs.readFile(fileName, 'utf8', function(err, data) {
        if (err) {
            console.log('Error reading project.json file: ' + err);
            return;
        }
        
        this._backupFile(fileName, backupFile);
        data = JSON.parse(data);

        if (data.commands.kestrel === undefined) {
            data.commands.kestrel = 'Microsoft.AspNet.Hosting --server Microsoft.AspNet.Server.Kestrel --server.urls http://*:' + this._portNumber;
            fs.writeFile(fileName, JSON.stringify(data), function(err) {
                if (err) {
                    console.log('Error writing to project.json file: ' + err);
                    return;
                }

            });
        }
    });
}

/**
 * Gets the template script name. 
 * @returns {string}
 */
AspnetHelper.prototype.getTemplateScriptName = function() {
    // Re-using Nodejs scripts.
    return util.isWindows() ? '_dockerTaskNodejs.cmd' : '_dockerTaskNodejs.sh';
}

/**
 * Gets the template Dockerfile name. 
 * @returns {string}
 */
AspnetHelper.prototype.getTemplateDockerfileName = function() {
    return '_Dockerfile.aspnet';
}

/**
 * Gets the port parameter to be used in the docker run command.
 * @returns {string}
 */
AspnetHelper.prototype._getPortParameter = function() {
    return '-p ' + util.scriptify('publicPort') + ':' + util.scriptify('containerPort');
}

/**
 * Gets the container run command used in docker run command. 
 * @returns {string}
 */
AspnetHelper.prototype.getContainerRunCommand = function() {
    return 'docker run -di ' + this._getPortParameter() + ' ' + util.scriptify('imageName');
}

/**
 * Gets the ASP.NET command name that's defined in the project.json file.
 * @returns {string}
 */
AspnetHelper.prototype.getAspnetCommandName = function() {
    return 'kestrel';
}

module.exports = AspnetHelper;
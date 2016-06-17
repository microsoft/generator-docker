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
 * @param {string} baseImageName - ASP.NET base image to use.
 * @param {int} portNumber - Port number.
 */
var AspNetHelper = function (baseImageName, portNumber) {
    this._baseImageName = baseImageName;
    this._portNumber = portNumber

    switch (baseImageName) {
        case 'aspnet:1.0.0-rc1-update1':
            this._templateFolder = 'dnx';
            this._dotnetVersion = 'RC1';
            break;
        case 'dotnet:1.0.0-preview1':
            this._templateFolder = 'dotnet';
            this._dotnetVersion = 'RC2';
            break;
        default:
            this._templateFolder = 'dotnet';
            this._dotnetVersion = 'RC2';
            break;
    }
}

/**
 * Creates dockerIgnore contents.
 * @returns {string}
 */
AspNetHelper.prototype.createDockerignoreFile = function () {
    return 'project.lock.json';
}

/**
 * Gets the Docker image name.
 * @returns {string}
 */
AspNetHelper.prototype.getDockerImageName = function (isDebug) {
    if (this._dotnetVersion === 'RC2' && !isDebug ) {
        return 'microsoft/dotnet:1.0.0-rc2-core';
    } else {
        return 'microsoft/' + this._baseImageName;
    }
}

/**
 * Gets the Dotnet version (RC1 or RC2).
 * @returns {string}
 */
AspNetHelper.prototype.getDotnetVersion = function (isDebug) {
    return this._dotnetVersion;
}

/**
 * Creates a backup of a file.
 * @param {string} sourceFile - Source file.
 * @param {string} targetFile - Target file.
 */
AspNetHelper.prototype._backupFile = function (sourceFile, targetFile, cb) {
    fs.readFile(sourceFile, 'utf8', function (err, data) {
        if (err) {
            cb('Error reading file: ' + err);
            return;
        }
        fs.writeFile(targetFile, data, function (err) {
            if (err) {
                cb('Error writing file: ' + err);
                return;
            }
            cb(null);
            return;
        });
    });
}

/**
 * Checks if  'UseUrls' is called in Program.cs, and adds it to any existing new WebHostBuilder call if it is not there yet.
 * @returns {string}
 */
AspNetHelper.prototype.updateProgramCS = function (cb) {
    var rootFolder = process.cwd() + path.sep;
    var fileName = rootFolder + 'Program.cs';
    var backupFile = rootFolder + 'Program.cs.backup';
    var port = this._portNumber;
    var self = this;
    fs.readFile(fileName, 'utf8', function (err, data) {
        if (err) {
            cb(new Error('Can\'t read Program.cs file. Make sure Program.cs file exists.'));
            return;
        }

        if (data.indexOf('.UseUrls(') < 0) {
            self._backupFile(fileName, backupFile, function(err)
            {
                if (err) {
                    cb(new Error('Can\'t backup Program.cs file.'));
                    return;
                }
                data = data.replace('new WebHostBuilder()', 'new WebHostBuilder().UseUrls("http://*:' + port + '")');
                fs.writeFile(fileName, data, function (err) {
                    if (err) {
                        cb(new Error('Can\'t write to Program.cs file.'));
                        return;
                    }
                    cb(null, 'We noticed your Program.cs file didn\'t call UseUrls. We\'ve fixed that for you.');
                    return;
                });
                return;
            });
            return;
        }
        cb(null, null);
        return;
    });
}

/**
 * RC1: Checks if  'web' command is in the  project.json and adds it if command is not there yet.
 * RC2: Ensures buildOptions is using debugType portable and publishOptions includes the dockerfiles
 * @returns {string}
 */
AspNetHelper.prototype.updateProjectJson = function (cb) {
    var rootFolder = process.cwd() + path.sep;
    var fileName = rootFolder + 'project.json';
    var backupFile = rootFolder + 'project.json.backup';
    var port = this._portNumber;
    var dotnetVersion = this._dotnetVersion;
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

        if (dotnetVersion === 'RC2' ) {
            var changed = false;
            if (data.buildOptions === undefined) {
                data.buildOptions = { };
                changed = true;
            }
            if (data.buildOptions !== "portable") {
                data.buildOptions.debugType = "portable";
                changed = true;
            }
            if (data.publishOptions === undefined) {
                data.publishOptions = { };
                changed = true;
            }
            if (data.publishOptions.include === undefined) {
                data.publishOptions.include = [ ];
                changed = true;
            }
            if (data.publishOptions.include.indexOf('dockerfile.debug') < 0) {
                data.publishOptions.include.push('dockerfile.debug');
                changed = true;
            }
            if (data.publishOptions.include.indexOf('dockerfile.release') < 0) {
                data.publishOptions.include.push('dockerfile.release');
                changed = true;
            }

            if (changed) {
                self._backupFile(fileName, backupFile, function (err) {
                    if (err) {
                        cb(new Error('Can\'t backup project.json file.'));
                        return;
                    }
                    fs.writeFile(fileName, JSON.stringify(data, null, 2), function (err) {
                        if (err) {
                            cb(new Error('Can\'t write to project.json file.'));
                            return;
                        }
                        cb(null, 'We noticed your project.json file didn\'t use portable .pdb files. We\'ve fixed that for you.');
                        return;
                    });
                    return;
                });
                return;
            }
        } else {
            if (data.commands.web === undefined) {
                self._backupFile(fileName, backupFile, function (err) {
                    if (err) {
                        cb(new Error('Can\'t backup project.json file.'));
                        return;
                    }
                    data.commands.web = 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:' + port;
                    fs.writeFile(fileName, JSON.stringify(data, null, 2), function (err) {
                        if (err) {
                            cb(new Error('Can\'t write to project.json file.'));
                            return;
                        }
                        cb(null, 'We noticed your project.json file didn\'t know how to start the kestrel web server. We\'ve fixed that for you.');
                        return;
                    });
                    return;
                });
                return;
            }
        }
        cb(null, null);
        return;
    });
}

/**
 * Gets the template docker-compose file name.
 * @returns {string}
 */
AspNetHelper.prototype.getTemplateDockerComposeFileName = function () {
    return 'docker-compose.yml';
}

/**
 * Gets the template dockerfile name.
 * @returns {string}
 */
AspNetHelper.prototype.getTemplateDockerFileName = function () {
    return path.join(this._templateFolder, 'Dockerfile');
}

module.exports = AspNetHelper;

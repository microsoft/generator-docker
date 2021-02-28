/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict'

var util = require('./utils.js');
var path = require('path');
var process = require('process');
var fs = require('fs');
var decomment = require('decomment');

/**
 * Represents a base helper for projects.
 * @constructor
 */
var BaseHelper = function () {
}

/**
 * Creates a backup of a file.
 * @param {string} sourceFile - Source file.
 * @param {string} targetFile - Target file.
 */
BaseHelper.prototype._backupFile = function (sourceFile, targetFile, cb) {
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
 * Checks if  'files.associations' is in the launch.json and adds it to the settings if it is not there yet.
 * @returns {string}
 */
BaseHelper.prototype.updateSettingsJson = function (cb) {
    var rootFolder = process.cwd();
    var codeFolder = path.join(rootFolder, '.vscode');
    var fileName = path.join(codeFolder, 'settings.json');
    var backupFile = path.join(codeFolder, 'settings.json.backup');
    var self = this;
    var writeFile = function (data, cb) {
        fs.writeFile(fileName, JSON.stringify(data, null, 2), function (err) {
            if (err) {
                cb(new Error('Can\'t write to settings.json file.'));
                return;
            }
            cb(null, 'We noticed your settings.json file didn\'t consider Dockerfile.debug a dockerfile, we fixed that for you.');
            return;
        });
        return;
    }
    var updateSettingsCB = function (data, existed, cb) {
        var changed = false;
        if (!data['files.associations']) {
            data['files.associations'] = { };
            changed = true;
        }
        if (!data['files.associations']['dockerfile.*']) {
            data['files.associations']['dockerfile.*'] = 'dockerfile';
            changed = true;
        }

        if (changed) {
            if (existed) {
                self._backupFile(fileName, backupFile, function (err) {
                    if (err) {
                        cb(new Error('Can\'t backup settings.json file.'));
                        return;
                    }
                    writeFile(data, cb);
                    return;
                });
                return;
            } else {
                writeFile(data, cb);
                return;
            }
        } else {
            cb(null);
            return;
        }
    };

    fs.stat(fileName, function (err, data) {
        if (err) {
            // File doesn't exist
            fs.stat(codeFolder, function (err, data) {
                if (err) {
                    // Folder doesn't exist
                    fs.mkdir(codeFolder, function (err, data) {
                        if (err) {
                            cb(new Error('Can\'t create .vscode folder.'));
                            return;
                        }
                        updateSettingsCB({}, false, cb);
                        return;
                    });
                    return;
                }
                updateSettingsCB({}, false, cb)
                return;
            });
            return;
        }

        fs.readFile(fileName, 'utf8', function (err, data) {
            if (err) {
                cb(new Error('Can\'t read settings.json file. Make sure settings.json file exists.'));
                return;
            }

            // Remove BOM.
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.replace(/^\uFEFF/, '');
            }

            data = JSON.parse(decomment(data));

            updateSettingsCB(data, true, cb);
        });
        return;
    });
}

module.exports = BaseHelper;
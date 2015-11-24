/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

function createGolangPrompts(isWebProject, portNumber, imageName) {
    return {
        projectType: 'golang',
        isGoWeb: isWebProject,
        portNumber: portNumber,
        imageName: imageName,
    }
}

describe('golang generator', function() {
    it('creates files', function(done) {
            helpers.run(path.join(__dirname, '../generators/app'))
                .withPrompts({
                    projectType: 'golang'
                })
                .withLocalConfig(function() {
                    return {
                        "appInsightsOptIn": false,
                        "runningTests": true
                    };
                })
                .on('end', function() {
                    assert.file([
                        'Dockerfile',
                        'dockerTask.sh',
                        'docker-compose.yml'
                    ]);
                });
            done();
        }),
        it('creates Dockerfile with correct contents (Web project)', function(done) {
            var portNumber = 1234;
            var imageName = 'golangimagename';
            helpers.run(path.join(__dirname, '../generators/app'))
                .withLocalConfig(function() {
                    return {
                        "appInsightsOptIn": false,
                        "runningTests": true
                    };
                })
                .withPrompts(createGolangPrompts(true, portNumber, imageName))
                .on('end', function() {
                    var currentFolder = process.cwd().split(path.sep).pop();
                    assert.fileContent(
                        'Dockerfile', 'FROM golang');
                    assert.fileContent(
                        'Dockerfile', 'ADD . /go/src/github.com/' + currentFolder);
                    assert.fileContent(
                        'Dockerfile', 'RUN go install github.com/' + currentFolder);
                    assert.fileContent(
                        'Dockerfile', 'ENTRYPOINT /go/bin/' + currentFolder);
                });
            done();
        }),
        it('creates Dockerfile with correct contents (non-Web project)', function(done) {
            var portNumber = 1234;
            var imageName = 'golangimagename';
            helpers.run(path.join(__dirname, '../generators/app'))
                .withLocalConfig(function() {
                    return {
                        "appInsightsOptIn": false,
                        "runningTests": true
                    };
                })
                .withPrompts(createGolangPrompts(false, portNumber, imageName))
                .on('end', function() {
                    var currentFolder = process.cwd().split(path.sep).pop();
                    assert.fileContent(
                        'Dockerfile', 'FROM golang');
                    assert.fileContent(
                        'Dockerfile', 'ADD . /go/src/github.com/' + currentFolder);
                    assert.fileContent(
                        'Dockerfile', 'RUN go install github.com/' + currentFolder);
                    assert.fileContent(
                        'Dockerfile', 'ENTRYPOINT /go/bin/' + currentFolder);
                });
            done();
        }),
        it('creates dockerTask.sh with correct contents (Web project)', function(done) {
            var portNumber = 1234;
            var imageName = 'golangimagename';
            helpers.run(path.join(__dirname, '../generators/app'))
                .withLocalConfig(function() {
                    return {
                        "appInsightsOptIn": false,
                        "runningTests": true
                    };
                })
                .withPrompts(createGolangPrompts(true, portNumber, imageName))
                .on('end', function() {
                    assert.fileContent(
                        'dockerTask.sh', 'imageName="' + imageName + '"');
                    assert.fileContent(
                        'dockerTask.sh', 'open \"http://$(docker-machine ip $(docker-machine active)):' + portNumber + '"');
                    assert.fileContent(
                        'dockerTask.sh', 'docker run -di -p ' + portNumber + ':' + portNumber + ' ' + imageName);
                });
            done();
        })
    it('creates dockerTask.sh with correct contents (non-Web project)', function(done) {
        var portNumber = 1234;
        var imageName = 'golangimagename';
        helpers.run(path.join(__dirname, '../generators/app'))
            .withLocalConfig(function() {
                return {
                    "appInsightsOptIn": false,
                    "runningTests": true
                };
            })
            .withPrompts(createGolangPrompts(false, portNumber, imageName))
            .on('end', function() {
                assert.fileContent(
                    'dockerTask.sh', 'imageName="' + imageName + '"');
                assert.noFileContent(
                    'dockerTask.sh', 'open \"http://$(docker-machine ip $(docker-machine active)):' + portNumber + '"');
                assert.fileContent(
                    'dockerTask.sh', 'docker run -di ' + imageName);
            });
        done();
    }),
      it('creates docker-compose with correct contents (non-Web project)', function(done) {
        var portNumber = 1234;
        var imageName = 'golangimagename';
        helpers.run(path.join(__dirname, '../generators/app'))
            .withLocalConfig(function() {
                return {
                    "appInsightsOptIn": false,
                    "runningTests": true
                };
            })
            .withPrompts(createGolangPrompts(false, portNumber, imageName))
            .on('end', function() {
                assert.fileContent(
                    'docker-compose.yml', imageName + ':');
                assert.fileContent(
                    'docker-compose.yml', 'dockerfile: Dockerfile');
                assert.fileContent(
                    'docker-compose.yml', 'build: .');
            });
        done();
    }),
          it('creates docker-compose with correct contents (Web project)', function(done) {
        var portNumber = 1234;
        var imageName = 'golangimagename';
        helpers.run(path.join(__dirname, '../generators/app'))
            .withLocalConfig(function() {
                return {
                    "appInsightsOptIn": false,
                    "runningTests": true
                };
            })
            .withPrompts(createGolangPrompts(false, portNumber, imageName))
            .on('end', function() {
                assert.fileContent(
                    'docker-compose.yml', imageName + ':');
                assert.fileContent(
                    'docker-compose.yml', 'dockerfile: Dockerfile');
                assert.fileContent(
                    'docker-compose.yml', 'build: .');
                assert.fileContent(
                    'docker-compose.yml', '- "' + portNumber + ':' + portNumber +'"');
            });
        done();
    })
});
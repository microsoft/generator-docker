/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var os = require('os');
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('Golang project file creation (non Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'golang', isGoWeb: false, imageName: 'testimagename' })
        .on('end', done);
    });

    it('generates dockerfiles', function (done) {
        assert.file('Dockerfile.debug');
        assert.file('Dockerfile.release');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.release.yml');
        done();
    });

    it('generates dockertask file', function (done) {
        assert.file('dockerTask.ps1');
        assert.file('dockerTask.sh');
        done();
    });

    it('generates tasks.json file', function (done) {
        assert.file('.vscode/tasks.json');
        done();
    });

    it('web project variable is set correctly in script file', function (done) {
        assert.fileContent('dockerTask.ps1', '$isWebProject=$false');
        assert.fileContent('dockerTask.sh', 'isWebProject=false');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.debug', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.release', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.noFileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.debug.yml', 'com.testimagename.environment: "debug"');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.release.yml', '"3000:3000"');
        assert.fileContent('docker-compose.release.yml', 'com.testimagename.environment: "release"');
        done();
    });
});

describe('Golang project file creation (Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'golang', imageName: 'testimagename' })
        .on('end', done);
    });

    it('generates dockerfiles', function (done) {
        assert.file('Dockerfile.debug');
        assert.file('Dockerfile.release');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.release.yml');
        done();
    });

    it('generates dockertask file', function (done) {
        assert.file('dockerTask.ps1');
        assert.file('dockerTask.sh');
        done();
    });

    it('generates tasks.json file', function (done) {
        assert.file('.vscode/tasks.json');
        done();
    });

    it('web project variable is set correctly in script file', function (done) {
        assert.fileContent('dockerTask.ps1', '$isWebProject=$true');
        assert.fileContent('dockerTask.sh', 'isWebProject=true');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.debug', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.release', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'com.testimagename.environment: "debug"');
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '"3000:3000"');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'image: testimagename');
        assert.fileContent('docker-compose.release.yml', 'com.testimagename.environment: "release"');
        assert.fileContent('docker-compose.release.yml', '"3000:3000"');
        done();
    });
});
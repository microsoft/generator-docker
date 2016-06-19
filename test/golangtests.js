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
        assert.file('Dockerfile');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.yml');
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

    it('Correct script file contents (powershell)', function (done) {
        assert.fileContent('dockerTask.ps1', '$isWebProject=$false');
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.noFileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'isWebProject=false');
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.noFileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
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
        assert.fileContent('Dockerfile', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.noFileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
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
        assert.file('Dockerfile');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.yml');
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

    it('Correct script file contents (powershell)', function (done) {
        assert.fileContent('dockerTask.ps1', '$isWebProject=$true');
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.noFileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'isWebProject=true');
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.noFileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
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
        assert.fileContent('Dockerfile', 'COPY . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile', 'ENTRYPOINT /go/bin/' + currentFolder);
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.fileContent('docker-compose.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });
});
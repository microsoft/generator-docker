/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

describe('Golang project file creation (non Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'golang', isGoWeb: false })
        .on('end', done);
    });

    it('generates dockerfiles', function (done) {
        assert.file('dockerfile.debug');
        assert.file('dockerfile.release');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.release.yml');
        done();
    });

    it('generates dockertask.sh file', function (done) {
        assert.file('dockerTask.sh');
        done();
    });
    
    it('web project variable is set correctly in script file', function (done) {
        assert.fileContent('dockerTask.sh', 'isWebProject=false');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.debug', 'ADD . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT /go/bin/' + currentFolder);
        done(); 
    });
    
    it('correct dockerfile contents (release)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.release', 'ADD . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT /go/bin/' + currentFolder);
        done(); 
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'dockerfile: Dockerfile.debug');
        assert.noFileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.debug.yml', '"debug"');
        done(); 
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'dockerfile: Dockerfile.release');
        assert.noFileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.release.yml', '"release"');
        done(); 
    });
});

describe('Golang project file creation (Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'golang' })
        .on('end', done);
    });

    it('generates dockerfiles', function (done) {
        assert.file('dockerfile.debug');
        assert.file('dockerfile.release');
        done();
    });

    it('generates compose files', function (done) {
        assert.file('docker-compose.debug.yml');
        assert.file('docker-compose.release.yml');
        done();
    });

    it('generates dockertask.sh file', function (done) {
        assert.file('dockerTask.sh');
        done();
    });
    
    it('web project variable is set correctly in script file', function (done) {
        assert.fileContent('dockerTask.sh', 'isWebProject=true');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.debug', 'ADD . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT /go/bin/' + currentFolder);
        done(); 
    });
    
    it('correct dockerfile contents (release)', function (done) {
        var currentFolder = process.cwd().split(path.sep).pop();
        assert.fileContent('Dockerfile.release', 'ADD . /go/src/github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'RUN go install github.com/' + currentFolder);
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT /go/bin/' + currentFolder);
        done(); 
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'dockerfile: Dockerfile.debug');
        assert.fileContent('docker-compose.debug.yml', '"debug"');
        assert.fileContent('docker-compose.debug.yml', '"3000:3000"');
        done(); 
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'dockerfile: Dockerfile.release');
        assert.fileContent('docker-compose.release.yml', '"release"');
        assert.fileContent('docker-compose.release.yml', '"3000:3000"');
        done(); 
    });
});
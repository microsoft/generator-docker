/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var os = require('os');
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('Node.js project file creation', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'nodejs', imageName: 'testimagename' })
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
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'isWebProject=true');
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'RUN npm install nodemon -g');
        assert.fileContent('Dockerfile.debug', 'RUN npm install');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.noFileContent('Dockerfile', 'nodemon');
        assert.fileContent('Dockerfile', 'CMD ["node", "./bin/www"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '.:/src');
        assert.fileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '.:/src');
        assert.fileContent('docker-compose.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });
});
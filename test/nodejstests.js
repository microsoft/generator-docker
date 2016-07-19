/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var os = require('os');
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('Node.js project file creation (Non Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'nodejs', isWebProject: false, imageName: 'testimagename' })
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

    it('generates settings.json file', function (done) {
        assert.file('.vscode/settings.json');
        done();
    });

    it('Correct script file contents (powershell)', function (done) {
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'RUN npm install nodemon -g');
        assert.fileContent('Dockerfile.debug', 'RUN npm install');
        assert.noFileContent('Dockerfile.debug', 'EXPOSE 3000');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 5858');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.noFileContent('Dockerfile', 'nodemon');
        assert.noFileContent('Dockerfile', 'EXPOSE 3000');
        assert.noFileContent('Dockerfile', 'EXPOSE 5858');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["npm", "start"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '.:/src');
        assert.noFileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.debug.yml', '"5858:5858"');
        assert.fileContent('docker-compose.debug.yml', 'ports:');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '.:/src');
        assert.noFileContent('docker-compose.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.yml', '"5858:5858"');
        assert.noFileContent('docker-compose.yml', 'ports:');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('Node.js project file creation (Web project)', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'nodejs', isWebProject: true, imageName: 'testimagename' })
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

    it('generates settings.json file', function (done) {
        assert.file('.vscode/settings.json');
        done();
    });

    it('Correct script file contents (powershell)', function (done) {
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'RUN npm install nodemon -g');
        assert.fileContent('Dockerfile.debug', 'RUN npm install');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 3000');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 5858');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.noFileContent('Dockerfile', 'nodemon');
        assert.fileContent('Dockerfile', 'EXPOSE 3000');
        assert.noFileContent('Dockerfile', 'EXPOSE 5858');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["npm", "start"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '.:/src');
        assert.fileContent('docker-compose.debug.yml', '"3000:3000"');
        assert.fileContent('docker-compose.debug.yml', '"5858:5858"');
        assert.fileContent('docker-compose.debug.yml', 'ports:');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '.:/src');
        assert.fileContent('docker-compose.yml', '"3000:3000"');
        assert.noFileContent('docker-compose.yml', '"5858:5858"');
        assert.fileContent('docker-compose.yml', 'ports:');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});
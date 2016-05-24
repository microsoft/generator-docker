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
        .withPrompts({ projectType: 'nodejs' })
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
        assert.file(os.platform() === 'win32' ? 'dockerTask.ps1' : 'dockerTask.sh');
        done();
    });

    it('web project variable is set correctly in script file', function (done) {
        if (os.platform() === 'win32') {
            assert.fileContent('dockerTask.ps1', '$isWebProject=$true');
        } else {
            assert.fileContent('dockerTask.sh', 'isWebProject=true');
        }
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'RUN npm install nodemon -g');
        assert.fileContent('Dockerfile.debug', 'RUN npm install');
        assert.fileContent('Dockerfile.debug', 'CMD ["nodemon"]');
        done(); 
    });
    
    it('correct dockerfile contents (release)', function (done) {
        assert.noFileContent('Dockerfile.release', 'RUN npm install nodemon -g');
        assert.fileContent('Dockerfile.release', 'CMD ["node", "./bin/www"]');
        done(); 
    });
    
    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'dockerfile: Dockerfile.debug');
        assert.fileContent('docker-compose.debug.yml', '.:/src');
        assert.fileContent('docker-compose.debug.yml', '"debug"');
        done(); 
    });
    
    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'dockerfile: Dockerfile.release');
        assert.noFileContent('docker-compose.release.yml', '.:/src');
        assert.fileContent('docker-compose.release.yml', '"release"');
        done(); 
    });
});
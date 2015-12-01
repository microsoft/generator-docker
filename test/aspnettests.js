/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;
var process = require('process');
var fs = require('fs');

function createAspNetPrompts(aspNetVersion, portNumber, imageName) {
    return {
        projectType: 'aspnet',
        aspNetVersion: aspNetVersion,
        portNumber: portNumber,
        imageName: imageName,
    }
}

function createTestProjectJson(dir, kestrelCommand) {
    var projectJsonData = {
        commands: {
            web: 'this is a web command'
        }
    };

    if (kestrelCommand !== undefined) {
        projectJsonData.commands.kestrel = kestrelCommand;
    }

    var outputFile = dir + path.sep + 'project.json';
    fs.writeFile(outputFile, JSON.stringify(projectJsonData, null, 4), function(err) {
        if (err) {
            assert.fail('error writing project.json file.');
        }
    });
}

describe('ASP.NET project file creation', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', aspNetVersion: '1.0.0-beta8' })
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
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/aspnet:1.0.0-beta8');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["dnx", "-p", "project.json", "kestrel"');
        done(); 
    });
    
    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile.release', 'FROM microsoft/aspnet:1.0.0-beta8');
        assert.fileContent('Dockerfile.release', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT ["dnx", "-p", "project.json", "kestrel"');
        done(); 
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'dockerfile: Dockerfile.debug');
        assert.fileContent('docker-compose.debug.yml', '"debug"');
        assert.fileContent('docker-compose.debug.yml', '"5000:5000"');
        done(); 
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.release.yml', 'dockerfile: Dockerfile.release');
        assert.fileContent('docker-compose.release.yml', '"release"');
        assert.fileContent('docker-compose.release.yml', '"5000:5000"');
        done(); 
    });
    
    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('update project.json and adds the kestrel command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', 'Microsoft.AspNet.Hosting --server Microsoft.AspNet.Server.Kestrel --server.urls http://*:5000');
        done();
    });
});

describe('ASP.NET project file creation when kestrel command exists', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir, 'EXISTING_KESTREL_COMMAND'); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', aspNetVersion: '1.0.0-beta8' })
        .on('end', done);
    });

    it('project.json.backup is not created', function (done) {
        assert.noFile('project.json.backup');
        done();
    });

    it('project.json is not modified', function (done) {
        assert.fileContent('project.json', 'EXISTING_KESTREL_COMMAND');
        done();
    });
});
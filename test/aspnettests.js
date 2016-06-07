/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

var os = require('os');
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var process = require('process');
var fs = require('fs-extra');

function createAspNetPrompts(baseImageName, portNumber, imageName) {
    return {
        projectType: 'aspnet',
        baseImageName: baseImageName,
        portNumber: portNumber,
        imageName: imageName,
    }
}

function createTestProjectJson(dir, webCommand) {
    var projectJsonData = {
        commands: {
            ef: 'this is a EF command'
        }
    };

    if (webCommand !== undefined) {
        projectJsonData.commands.web = webCommand;
    }

    var outputFile = dir + path.sep + 'project.json';
    fs.writeFileSync(outputFile, JSON.stringify(projectJsonData, null, 4));
}

function createTestProgramCS(dir) {
    var contents =
'using System;\
using System.Collections.Generic;\
using System.IO;\
using System.Linq;\
using System.Threading.Tasks;\
using Microsoft.AspNetCore.Hosting;\
\
namespace WebApplication1\
{\
    public class Program\
    {\
        public static void Main(string[] args)\
        {\
            var host = new WebHostBuilder()\
                .UseKestrel()\
                .UseContentRoot(Directory.GetCurrentDirectory())\
                .UseIISIntegration()\
                .UseStartup<Startup>()\
                .Build();\
\
            host.Run();\
        }\
    }\
}'

    var outputFile = dir + path.sep + 'Program.cs';
    
    fs.writeFileSync(outputFile, contents);
}

function createTestProgramCSWithUseUrls(dir) {
    var contents =
'using System;\
using System.Collections.Generic;\
using System.IO;\
using System.Linq;\
using System.Threading.Tasks;\
using Microsoft.AspNetCore.Hosting;\
\
namespace WebApplication1\
{\
    public class Program\
    {\
        public static void Main(string[] args)\
        {\
            var host = new WebHostBuilder()\
                .UseUrls("http://contoso.com:80")\
                .UseKestrel()\
                .UseContentRoot(Directory.GetCurrentDirectory())\
                .UseIISIntegration()\
                .UseStartup<Startup>()\
                .Build();\
\
            host.Run();\
        }\
    }\
}'

    var outputFile = dir + path.sep + 'Program.cs';
    
    fs.writeFileSync(outputFile, contents);
}

describe('ASP.NET RC1 project file creation', function () {
    // On windows this test takes longer than the default 2s
    this.timeout(10000);
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', baseImageName: 'aspnet:1.0.0-rc1-update1' })
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

    it('generates dockertask files', function (done) {
        assert.file('dockerTask.ps1');
        assert.file('dockerTask.sh');
        done();
    });

    it('OpenSite is included in script file', function (done) {
        assert.fileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.sh', 'openSite');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dnu", "restore"');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile.release', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dnu", "restore"');
        assert.fileContent('Dockerfile.release', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
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

    it('update project.json and adds the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:5000');
        done();
    });
});

describe('ASP.NET RC2 project file creation', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir);
            createTestProgramCS(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', baseImageName: 'dotnet:1.0.0-preview1' })
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

    it('OpenSite is included in script file', function (done) {
        assert.fileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.sh', 'openSite');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/dotnet:1.0.0-preview1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT ["dotnet", "run"');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile.release', 'FROM microsoft/dotnet:1.0.0-preview1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.fileContent('Dockerfile.release', 'EXPOSE 5000');
        assert.fileContent('Dockerfile.release', 'ENTRYPOINT ["dotnet", "run"');
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

    it('doesn\'t generate project.json.backup file', function (done) {
        assert.noFile('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:5000');
        done();
    });

    it('generates Program.cs.backup file', function (done) {
        assert.file('Program.cs.backup');
        done();
    });

    it('update Program.cs and adds UseUrls if it doesn\'t exist', function (done) {
        assert.file('Program.cs');
        assert.fileContent('Program.cs', '.UseUrls("http://*:5000")');
        done();
    });
});

describe('ASP.NET RC1 project file creation when web command exists', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir, 'EXISTING_WEB_COMMAND'); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', baseImageName: 'aspnet:1.0.0-rc1-update1' })
        .on('end', done);
    });

    it('project.json.backup is not created', function (done) {
        assert.noFile('project.json.backup');
        done();
    });

    it('project.json is not modified', function (done) {
        assert.fileContent('project.json', 'EXISTING_WEB_COMMAND');
        done();
    });
});

describe('ASP.NET RC2 project file creation when UseUrls exists', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir);
            createTestProgramCSWithUseUrls(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'aspnet', baseImageName: 'aspnet:1.0.0-rc1-update1' })
        .on('end', done);
    });

    it('Program.cs.backup is not created', function (done) {
        assert.noFile('Program.cs.backup');
        done();
    });

    it('Program.cs not modified', function (done) {
        assert.noFileContent('Program.cs', '.UseUrls("http://*:5000")');
        done();
    });
});


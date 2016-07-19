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

function createDotNetPrompts(baseImageName, portNumber, imageName) {
    return {
        projectType: 'dotnet',
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

describe('.NET RC1 project file creation (Web project)', function () {
    // On windows this test takes longer than the default 2s
    this.timeout(15000);
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', isWebProject: true, baseImageName: 'aspnet:1.0.0-rc1-update1', imageName: 'testimagename' })
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

    it('generates dockertask files', function (done) {
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
        assert.fileContent('dockerTask.ps1', 'OpenSite');
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.noFileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'openSite');
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.noFileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dnu", "restore"');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile', 'RUN ["dnu", "restore"');
        assert.fileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '"80:80"');
        assert.noFileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.fileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('update project.json and adds the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RC1 project file creation (Non Web project)', function () {
    // On windows this test takes longer than the default 2s
    this.timeout(15000);
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', isWebProject: false, baseImageName: 'aspnet:1.0.0-rc1-update1', imageName: 'testimagename' })
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

    it('generates dockertask files', function (done) {
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
        assert.noFileContent('dockerTask.ps1', 'OpenSite');
        assert.noFileContent('dockerTask.ps1', 'dotnet publish');
        assert.noFileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.noFileContent('dockerTask.ps1', 'startDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.noFileContent('dockerTask.sh', 'openSite');
        assert.noFileContent('dockerTask.sh', 'dotnet publish');
        assert.noFileContent('dockerTask.sh', 'composeForDebug');
        assert.noFileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile.debug', 'RUN ["dnu", "restore"');
        assert.noFileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/aspnet:1.0.0-rc1-update1');
        assert.fileContent('Dockerfile', 'RUN ["dnu", "restore"');
        assert.noFileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dnx", "-p", "project.json", "web"');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.noFileContent('docker-compose.debug.yml', '"80:80"');
        assert.noFileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('does not generate project.json.backup file', function (done) {
        assert.noFile('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RC2 project file creation (Web project)', function () {
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir);
            createTestProgramCS(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', isWebProject: true, baseImageName: 'dotnet:1.0.0-preview1', imageName: 'testimagename' })
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
        assert.fileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.fileContent('dockerTask.ps1', 'StartDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'openSite');
        assert.fileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.fileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/dotnet:1.0.0-preview1');
        assert.fileContent('Dockerfile.debug', 'COPY . /app');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "build", "-c", "debug"]');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then dotnet ' + process.cwd().split(path.sep).pop() + '.dll; else sleep infinity; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/dotnet:1.0.0-rc2-core');
        assert.fileContent('Dockerfile', 'COPY . /app');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "build", "-c", "release"]');
        assert.fileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dotnet", "' + process.cwd().split(path.sep).pop() + '.dll"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '"80:80"');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.fileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('Update project.json to add portable pdbs and publishing dockerfiles', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', '"debugType": "portable"');
        assert.fileContent('project.json', '"Dockerfile.debug"');
        assert.fileContent('project.json', '"Dockerfile"');
        done();
    });

    it('generates Program.cs.backup file', function (done) {
        assert.file('Program.cs.backup');
        done();
    });

    it('update Program.cs and adds UseUrls if it doesn\'t exist', function (done) {
        assert.file('Program.cs');
        assert.fileContent('Program.cs', '.UseUrls("http://*:80")');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RC2 project file creation (Non Web project)', function () {
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir);
            createTestProgramCS(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', isWebProject: false, baseImageName: 'dotnet:1.0.0-preview1', imageName: 'testimagename' })
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
        assert.noFileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.fileContent('dockerTask.ps1', 'StartDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.noFileContent('dockerTask.sh', 'openSite');
        assert.fileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.fileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/dotnet:1.0.0-preview1');
        assert.fileContent('Dockerfile.debug', 'COPY . /app');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "build", "-c", "debug"]');
        assert.noFileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then dotnet ' + process.cwd().split(path.sep).pop() + '.dll; else sleep infinity; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/dotnet:1.0.0-rc2-core');
        assert.fileContent('Dockerfile', 'COPY . /app');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "build", "-c", "release"]');
        assert.noFileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dotnet", "' + process.cwd().split(path.sep).pop() + '.dll"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.noFileContent('docker-compose.debug.yml', '"80:80"');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('Update project.json to add portable pdbs and publishing dockerfiles', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', '"debugType": "portable"');
        assert.fileContent('project.json', '"Dockerfile.debug"');
        assert.fileContent('project.json', '"Dockerfile"');
        done();
    });

    it('does not generate Program.cs.backup file', function (done) {
        assert.noFile('Program.cs.backup');
        done();
    });

    it('doesn\'t update Program.cs and adds UseUrls if it doesn\'t exist', function (done) {
        assert.file('Program.cs');
        assert.noFileContent('Program.cs', '.UseUrls("http://*:80")');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RTM project file creation (Web project)', function () {
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir);
            createTestProgramCS(dir);
        })
        .withLocalConfig(function () {
            return { "appInsightsOptIn": false, "runningTests": true };
        })
        .withPrompts({ projectType: 'dotnet', isWebProject: true, baseImageName: 'dotnet:1.0.0-preview2-sdk', imageName: 'testimagename' })
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
        assert.fileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.fileContent('dockerTask.ps1', 'StartDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.fileContent('dockerTask.sh', 'openSite');
        assert.fileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.fileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/dotnet:1.0.0-preview2-sdk');
        assert.fileContent('Dockerfile.debug', 'COPY . /app');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "build", "-c", "debug"]');
        assert.fileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then dotnet ' + process.cwd().split(path.sep).pop() + '.dll; else sleep infinity; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/dotnet:1.0.0-core');
        assert.fileContent('Dockerfile', 'COPY . /app');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "build", "-c", "release"]');
        assert.fileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dotnet", "' + process.cwd().split(path.sep).pop() + '.dll"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.fileContent('docker-compose.debug.yml', '"80:80"');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.fileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('Update project.json to add portable pdbs and publishing dockerfiles', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', '"debugType": "portable"');
        assert.fileContent('project.json', '"Dockerfile.debug"');
        assert.fileContent('project.json', '"Dockerfile"');
        done();
    });

    it('doesn\'t update Program.cs and adds UseUrls if it doesn\'t exist', function (done) {
        assert.file('Program.cs');
        assert.noFileContent('Program.cs', '.UseUrls("http://*:80")');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RTM project file creation (Non Web project)', function () {
    before(function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
        .inTmpDir(function (dir) {
            createTestProjectJson(dir);
            createTestProgramCS(dir);
        })
        .withLocalConfig(function () {
            return { "appInsightsOptIn": false, "runningTests": true };
        })
        .withPrompts({ projectType: 'dotnet', isWebProject: false, baseImageName: 'dotnet:1.0.0-preview2-sdk', imageName: 'testimagename' })
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
        assert.noFileContent('dockerTask.ps1', 'OpenSite');
        assert.fileContent('dockerTask.ps1', 'dotnet publish');
        assert.fileContent('dockerTask.ps1', 'ComposeForDebug');
        assert.fileContent('dockerTask.ps1', 'StartDebugging');
        done();
    });

    it('Correct script file contents (bash)', function (done) {
        assert.noFileContent('dockerTask.sh', 'openSite');
        assert.fileContent('dockerTask.sh', 'dotnet publish');
        assert.fileContent('dockerTask.sh', 'composeForDebug');
        assert.fileContent('dockerTask.sh', 'startDebugging');
        done();
    });

    it('correct dockerfile contents (debug)', function (done) {
        assert.fileContent('Dockerfile.debug', 'FROM microsoft/dotnet:1.0.0-preview2-sdk');
        assert.fileContent('Dockerfile.debug', 'COPY . /app');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile.debug', 'RUN ["dotnet", "build", "-c", "debug"]');
        assert.noFileContent('Dockerfile.debug', 'EXPOSE 80');
        assert.fileContent('Dockerfile.debug', 'ENTRYPOINT ["/bin/bash", "-c", "if [ -z \\"$REMOTE_DEBUGGING\\" ]; then dotnet ' + process.cwd().split(path.sep).pop() + '.dll; else sleep infinity; fi"]');
        done();
    });

    it('correct dockerfile contents (release)', function (done) {
        assert.fileContent('Dockerfile', 'FROM microsoft/dotnet:1.0.0-core');
        assert.fileContent('Dockerfile', 'COPY . /app');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "restore"]');
        assert.noFileContent('Dockerfile', 'RUN ["dotnet", "build", "-c", "release"]');
        assert.noFileContent('Dockerfile', 'EXPOSE 80');
        assert.fileContent('Dockerfile', 'ENTRYPOINT ["dotnet", "' + process.cwd().split(path.sep).pop() + '.dll"]');
        done();
    });

    it('correct compose file contents (debug)', function (done) {
        assert.fileContent('docker-compose.debug.yml', 'image: testimagename:debug');
        assert.noFileContent('docker-compose.debug.yml', '"80:80"');
        assert.fileContent('docker-compose.debug.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('correct compose file contents (release)', function (done) {
        assert.fileContent('docker-compose.yml', 'image: testimagename');
        assert.noFileContent('docker-compose.yml', '"80:80"');
        assert.noFileContent('docker-compose.yml', '- REMOTE_DEBUGGING');
        done();
    });

    it('generates project.json.backup file', function (done) {
        assert.file('project.json.backup');
        done();
    });

    it('doesn\'t update project.json to add the web command if it doesn\'t exist', function (done) {
        assert.file('project.json');
        assert.noFileContent('project.json', 'Microsoft.AspNet.Server.Kestrel --server.urls http://*:80');
        done();
    });

    it('Update project.json to add portable pdbs and publishing dockerfiles', function (done) {
        assert.file('project.json');
        assert.fileContent('project.json', '"debugType": "portable"');
        assert.fileContent('project.json', '"Dockerfile.debug"');
        assert.fileContent('project.json', '"Dockerfile"');
        done();
    });

    it('doesn\'t update Program.cs and adds UseUrls if it doesn\'t exist', function (done) {
        assert.file('Program.cs');
        assert.noFileContent('Program.cs', '.UseUrls("http://*:80")');
        done();
    });

    it('correct settings.json file contents', function (done) {
        assert.fileContent('.vscode/settings.json', '"dockerfile.*": "dockerfile"');
        done();
    });
});

describe('.NET RC1 project file creation when web command exists', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir, 'EXISTING_WEB_COMMAND'); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', baseImageName: 'aspnet:1.0.0-rc1-update1' })
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

describe('.NET RC2 project file creation when UseUrls exists', function () {
    before(function (done) {
        helpers.run(path.join( __dirname, '../generators/app'))
        .inTmpDir(function(dir) {
            createTestProjectJson(dir);
            createTestProgramCSWithUseUrls(dir); })
        .withLocalConfig(function() {
            return { "appInsightsOptIn": false, "runningTests": true }; })
        .withPrompts({ projectType: 'dotnet', baseImageName: 'dotnet:1.0.0-preview1' })
        .on('end', done);
    });

    it('Program.cs.backup is not created', function (done) {
        assert.noFile('Program.cs.backup');
        done();
    });

    it('Program.cs not modified', function (done) {
        assert.noFileContent('Program.cs', '.UseUrls("http://*:80")');
        done();
    });
});


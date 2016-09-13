/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var process = require('process');
var exec = require('child_process').exec;
var util = require('./utils.js');
var NodejsHelper = require('./nodejsHelper.js');
var GolangHelper = require('./golangHelper.js');
var DotNetHelper = require('./dotnetHelper.js');
var Configstore = require('configstore');
var appInsights = require('applicationinsights');
var os = require('os');
var uuid = require('node-uuid');

// General
var projectType = '';
var error = false;
var updateSettingsJsonNoteForUser = null;
var isWebProject = false;

// Docker variables
var portNumber = 3000;
var imageName = '';
var serviceName = '';
var composeProjectName = '';
var DOCKERIGNORE_NAME = '.dockerignore';
var DEBUG_DOCKERFILE_NAME = 'Dockerfile.debug';
var DEBUG_DOCKERCOMPOSE_NAME = 'docker-compose.debug.yml';
var RELEASE_DOCKERFILE_NAME = 'Dockerfile';
var RELEASE_DOCKERCOMPOSE_NAME = 'docker-compose.yml';

// .NET variables
var baseImageName = '';
var updateProjectJsonNoteForUser = null;
var updateProgramCSNoteForUser = null;

// Application insights variables.
var pkg = require(__dirname + '/../../package.json');
var AppInsightsOptInName = 'appInsightsOptIn';
var AppInsightsUserIdName = 'userId';
var AppInsightsKey = '21098969-0721-47bc-87cb-e346d186a9f5';
var trackData = false;
var userId = '';

/**
 * Show prompts to the user.
 */
function showPrompts() {
    var done = this.async();
    var prompts = [{
        type: 'list',
        name: 'projectType',
        message: 'What language is your project using?',
        choices: [{
            name: '.NET Core',
            value: 'dotnet'
        }, {
            name: 'Golang',
            value: 'golang'
        }, {
            name: 'Node.js',
            value: 'nodejs'
        }]
    }, {
        type: 'list',
        name: 'baseImageName',
        message: 'Which version of .NET Core is your project using?',
        choices: [{
            name: 'rtm',
            value: 'dotnet:1.0.0-preview2-sdk'
        }, {
            name: 'rc2',
            value: 'dotnet:1.0.0-preview1'
        }, {
            name: 'rc1',
            value: 'aspnet:1.0.0-rc1-update1'
        }],
        when: function (answers) {
            return answers.projectType === 'dotnet';
        }
    }, {
        type: 'confirm',
        name: 'isWebProject',
        message: 'Does your project use a web server?',
        default: function (answers) {
            return true;
        }
    }, {
        type: 'input',
        name: 'portNumber',
        message: 'Which port is your app listening to?',
        default: function (answers) {
            // work around https://github.com/SamVerschueren/vscode-yo/issues/41 when running under yo extension in VS Code
            //return answers.projectType === 'dotnet' ? 80 : 3000;
            return 3000;
        },
        when: function (answers) {
            // Show this answer if user picked .NET, Node.js or Golang that's using a web server.
            return answers.isWebProject;
        }
    }, {
        type: 'input',
        name: 'imageName',
        message: 'What do you want to name your image?',
        default: process.cwd().split(path.sep).pop().toLowerCase()
    }, {
        type: 'input',
        name: 'serviceName',
        message: 'What do you want to name your service?',
        default: process.cwd().split(path.sep).pop().toLowerCase()
    }, {
        type: 'input',
        name: 'composeProjectName',
        message: 'What do you want to name your compose project?',
        default: process.cwd().split(path.sep).pop().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
    }];

    this.prompt(prompts, function (props) {
        projectType = props.projectType;
        isWebProject = props.isWebProject;
        portNumber = props.portNumber;
        imageName = props.imageName;
        serviceName = props.serviceName;
        baseImageName = props.baseImageName;
        composeProjectName = props.composeProjectName.replace(/[^a-zA-Z0-9]/g, '');
        done();
    }.bind(this));
}

/**
 * Create a default template data object
 */
function getDefaultTemplateData() {
    return {
        projectType: projectType,
        composeProjectName: composeProjectName,
        imageName: imageName,
        serviceName: serviceName,
        portNumber: portNumber,
        debugPortNumber: null,
        isWebProject: isWebProject,
        volumeMap: null,
        includeComposeForDebug: false,
        includeStartDebugging: false
    }
}

/**
 * Handles Node.js option.
 */
function handleNodeJs(yo) {
    var nodeJs = new NodejsHelper();

    var done = yo.async();
    var updateFiles = function () { done(); }

    if (!nodeJs.canShareVolume()) {
        yo.log(chalk.yellow('Warning: Your project has to be under %HOMEDRIVE%\Users folder in order to use Nodemon on Windows in the Debug environment.'));
    }

    var templateData = getDefaultTemplateData();
    templateData.volumeMap = '.:/src';
    templateData.includeComposeForDebug = true;
    templateData.debugPortNumber = "5858";

    yo.fs.copyTpl(
        yo.templatePath('node/launch.json'),
        yo.destinationPath('.vscode/launch.json'),
        templateData);

    handleCommmonTemplates(yo, nodeJs, templateData, updateFiles.bind(yo));
}

/**
 * Handles Golang option.
 */
function handleGolang(yo) {
    var golang = new GolangHelper();

    var done = yo.async();
    var updateFiles = function () { done(); }

    var templateData = getDefaultTemplateData();
    templateData.isWebProject = isWebProject;
    templateData.projectName = golang.getProjectName();

    handleCommmonTemplates(yo, golang, templateData, updateFiles.bind(yo));
}

/**
 * Handles .NET option.
 */
function handleDotNet(yo) {
    var dotNet = new DotNetHelper(baseImageName, portNumber, isWebProject);

    var done = yo.async();
    var dotnetVersion = dotNet.getDotnetVersion();
    var updateFiles = function () {
        dotNet.updateProjectJson(function (err, projectJsonNote) {
            if (err) {
                error = true;
                yo.log.error(err);
                done();
                return;
            }
            updateProjectJsonNoteForUser = projectJsonNote;

            if (dotNet.getDotnetVersion() == 'RC2' && isWebProject) {
                dotNet.updateProgramCS(function (err, programCSNode) {
                    if (err) {
                        error = true;
                        yo.log.error(err);
                        done();
                        return;
                    }
                    updateProgramCSNoteForUser = programCSNode;
                    done();
                    return;
                });
            } else {
                done();
            }
            return;
        });
    };

    var templateData = getDefaultTemplateData();
    templateData.outputName = process.cwd().split(path.sep).pop() + '.dll';
    templateData.dotnetVersion = dotnetVersion;
    templateData.debugBaseImageName = dotNet.getDockerImageName(true);
    templateData.releaseBaseImageName = dotNet.getDockerImageName(false);
    templateData.includeComposeForDebug = (dotnetVersion == 'RC2' || dotnetVersion == 'RTM');
    templateData.includeStartDebugging = (dotnetVersion == 'RC2' || dotnetVersion == 'RTM');

    if (dotnetVersion == 'RC2' || dotnetVersion == 'RTM') {
        yo.fs.copyTpl(
            yo.templatePath('dotnet/launch.json'),
            yo.destinationPath('.vscode/launch.json'),
            templateData);
    }
    else {
        var dockerignoreFileContents = dotNet.createDockerignoreFile();
        yo.fs.write(yo.destinationPath(DOCKERIGNORE_NAME), new Buffer(dockerignoreFileContents));
    }

    handleCommmonTemplates(yo, dotNet, templateData, updateFiles.bind(yo));
}

/**
 * Handles the common template files
 */
function handleCommmonTemplates(yo, helper, templateData, cb) {
    var debugTemplateData = Object.create(templateData, {
        environment: { value: 'debug' }
    });
    var releaseTemplateData = Object.create(templateData, {
        environment: { value: 'release' }
    });

    yo.fs.copyTpl(
        yo.templatePath(helper.getTemplateDockerFileName()),
        yo.destinationPath(DEBUG_DOCKERFILE_NAME),
        debugTemplateData);

    yo.fs.copyTpl(
        yo.templatePath(helper.getTemplateDockerFileName()),
        yo.destinationPath(RELEASE_DOCKERFILE_NAME),
        releaseTemplateData);

    yo.fs.copyTpl(
        yo.templatePath(helper.getTemplateDockerComposeFileName()),
        yo.destinationPath(DEBUG_DOCKERCOMPOSE_NAME),
        debugTemplateData);

    yo.fs.copyTpl(
        yo.templatePath(helper.getTemplateDockerComposeFileName()),
        yo.destinationPath(RELEASE_DOCKERCOMPOSE_NAME),
        releaseTemplateData);

    yo.fs.copyTpl(
        yo.templatePath('_dockerTaskGeneric.ps1'),
        yo.destinationPath('dockerTask.ps1'),
        templateData);

    yo.fs.copyTpl(
        yo.templatePath('_dockerTaskGeneric.sh'),
        yo.destinationPath('dockerTask.sh'),
        templateData);

    yo.fs.copyTpl(
        yo.templatePath('tasks.json'),
        yo.destinationPath('.vscode/tasks.json'),
        templateData);

    helper.updateSettingsJson(function (err, updateSettingsJsonNote) {
        if (err) {
            error = true;
            yo.log.error(err);
            cb();
            return;
        }

        updateSettingsJsonNoteForUser = updateSettingsJsonNote;
        cb();
        return;
    });
}

/**
 * Called at the end of the generator.
 */
function end() {
    if (error) {
        this.log(chalk.red('Errors occured. Please fix them and re-run the generator.'));
        return;
    }

    if (!util.isWindows()) {
        var done = this.async();
        exec('chmod +x ' + util.getDestinationScriptName(), function (err) {
            if (err) {
                this.log.error(err);
                this.log.error('Error making script executable. Run ' + chalk.bold('chmod +x ' + util.getDestinationScriptName()) + ' manually.');
                error = true;
            }
            done();
        }.bind(this));
    }

    if (updateProgramCSNoteForUser !== null) {
        this.log(updateProgramCSNoteForUser);
    }

    if (updateProjectJsonNoteForUser !== null) {
        this.log(updateProjectJsonNoteForUser);
    }

    logData();
    this.log('Your project is now ready to run in a Docker container!');
    this.log('Run ' + chalk.green(util.getDestinationScriptName()) + ' to build a Docker image and run your app in a container.');
}

/**
 * Sends the data to application insights.
 */
function logData() {
    if (!trackData) {
        return;
    }

    if (DockerGenerator.config !== undefined && DockerGenerator.config.get('runningTests') !== undefined) {
        return;
    }

    var client = appInsights.getClient(AppInsightsKey);
    client.config.maxBatchIntervalMs = 1000;
    appInsights.setup(AppInsightsKey).start();

    client.trackEvent('YoDockerLaunch', {
        'userId': userId,
        'version': pkg.version,
        'osPlatform': os.platform(),
        'projectType': projectType,
        'portNumber': portNumber,
        'imageName': imageName,
        'isWebProject': isWebProject === undefined ? 'undefined' : isWebProject,
        'baseImageName': imageName === undefined ? 'undefined' : baseImageName
    });

    // Workaround for https://github.com/Microsoft/ApplicationInsights-node.js/issues/54
    appInsights.setAutoCollectPerformance(false);
}

/**
 * Prompts for data tracking permission and sets up the global opt-in.
 */
function handleAppInsights(yo) {
    // Config is stored at: ~/.config/configstore/generator-docker.json
    var config = new Configstore(pkg.name);

    if (config.get('runningTests') !== undefined) {
        return;
    }

    if (config.get(AppInsightsOptInName) === undefined) {
        var done = yo.async();
        var q = {
            type: 'confirm',
            name: 'optIn',
            message: 'Generator-docker would like to collect anonymized data\n' +
            'on the options you selected to understand and improve your experience.\n' +
            'To opt out later, you can delete ' + chalk.red('~/.config/configstore/' + pkg.name + '.json.\n') +
            'Will you help us help you and your fellow developers?',
            default: true
        };

        yo.prompt(q, function (props) {
            trackData = props.optIn;

            // Set the userId only if user opted-in.
            userId = trackData ? uuid.v1() : '';

            config.set(AppInsightsOptInName, trackData);
            config.set(AppInsightsUserIdName, userId);

            var client = appInsights.getClient(AppInsightsKey);
            client.config.maxBatchIntervalMs = 1000;
            appInsights.setup(AppInsightsKey).start();

            client.trackEvent('YoDockerCollectData', {
                'opt-in': trackData.toString(),
                'userId': userId
            });

            appInsights.setAutoCollectPerformance(false);

            done();
        }.bind(yo));
    } else {
        trackData = config.get(AppInsightsOptInName);
        userId = config.get(AppInsightsUserIdName);

        // Create a user Id for opted-in users.
        if (trackData && userId === undefined) {
            userId = uuid.v1();
            config.set(AppInsightsUserIdName, userId);
        }
    }
}

/**
 * Docker Generator.
 */
var DockerGenerator = yeoman.generators.Base.extend({
    constructor: function () {
        yeoman.generators.Base.apply(this, arguments);
    },

    init: function () {
        this.log(yosay('Welcome to the ' + chalk.red('Docker') + ' generator!' + chalk.green('\nLet\'s add Docker container magic to your app!')));
        handleAppInsights(this);
    },
    askFor: showPrompts,
    writing: function () {
        this.sourceRoot(path.join(__dirname, './templates'));
        switch (projectType) {
            case 'nodejs':
                {
                    handleNodeJs(this);
                    break;
                }
            case 'golang':
                {
                    handleGolang(this);
                    break;
                }
            case 'dotnet':
                {
                    handleDotNet(this);
                    break;
                }
            default:
                this.log.error(':( not implemented.');
                break;
        }
    },
    end: end
});

module.exports = DockerGenerator;
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
var AspNetHelper = require('./aspnetHelper.js');
var Configstore = require('configstore');
var appInsights = require('applicationinsights');
var os = require('os');

// General
var projectType = '';
var error = false;

// Docker variables
var portNumber = 3000;
var imageName = '';
var DOCKERFILE_NAME = 'Dockerfile';
var DOCKERCOMPOSE_NAME = 'docker-compose.yml';

// Node.js variables
var addNodemon = false;

// Golang variables
var isGoWeb = false;

// ASP.NET variables
var aspNetVersion = '';
var kestrelCommandAdded = false;

// Application insights variables.
var pkg = require(__dirname + '/../../package.json');
var AppInsightsOptInName = 'appInsightsOptIn';
var AppInsightsKey = '21098969-0721-47bc-87cb-e346d186a9f5';
var trackData = false;

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
            name: 'ASP.NET 5',
            value: 'aspnet'
        }, {
            name: 'Golang',
            value: 'golang'
        }, {
            name: 'Node.js',
            value: 'nodejs'
        }]
    }, {
        type: 'confirm',
        name: 'addNodemon',
        message: 'Do you want to use Nodemon?',
        when: function(answers) {
            return answers.projectType === 'nodejs';
        }
    }, {
        type: 'list',
        name: 'aspNetVersion',
        message: 'Which version of ASP.NET 5 is your project using?',
        choices: [{
            name: 'beta8',
            value: '1.0.0-beta8'
        }, {
            name: 'beta7',
            value: '1.0.0-beta7'
        }],
        when: function(answers) {
            return answers.projectType === 'aspnet';
        }
    }, {
        type: 'confirm',
        name: 'isGoWeb',
        message: 'Does your Go project use a web server?',
        when: function(answers) {
            return answers.projectType === 'golang';
        }
    }, {
        type: 'input',
        name: 'portNumber',
        message: 'Which port is your app listening to?',
        default: function(answers) {
            return answers.projectType === 'aspnet' ? 5000 : 3000;
        },
        when: function(answers) {
            // Show this answer if user picked ASP.NET, Node.js or Golang that's using a web server.
            return answers.projectType === 'aspnet' || answers.projectType === 'nodejs' || (answers.projectType === 'golang' && answers.isGoWeb);
        }
    }, {
        type: 'input',
        name: 'imageName',
        message: 'What do you want to name your image?',
        default: process.cwd().split(path.sep).pop().toLowerCase() + '_image',
    }];

    this.prompt(prompts, function(props) {
        projectType = props.projectType;
        addNodemon = props.addNodemon;
        portNumber = props.portNumber;
        imageName = props.imageName;
        isGoWeb = props.isGoWeb;
        aspNetVersion = props.aspNetVersion;
        done();
    }.bind(this));
}

/**
 * Handles Node.js option.
 */
function handleNodeJs(yo) {
    var nodeJs = new NodejsHelper(addNodemon, portNumber, imageName);

    if (!nodeJs.canShareVolume()) {
        error = true;
        yo.log.error('Your project has to be under %HOMEDRIVE%\Users folder in order to use Nodemon on Windows.');
        return;
    }

    var dockerfileContents = nodeJs.createDockerfile();
    yo.fs.write(yo.destinationPath(DOCKERFILE_NAME), new Buffer(dockerfileContents));
    
    var dockerComposeContents = nodeJs.createDockerComposeFile();
    yo.fs.write(yo.destinationPath('docker-compose.yml'), new Buffer(dockerComposeContents));

    yo.fs.copyTpl(
        yo.templatePath(nodeJs.getTemplateScriptName()),
        yo.destinationPath(util.getDestinationScriptName()), {
            imageName: imageName,
            portNumber: portNumber,
            containerRunCommand: nodeJs.getContainerRunCommand()
        });
}

/**
 * Handles Golang option.
 */
function handleGolang(yo) {
    var golang = new GolangHelper(isGoWeb, portNumber, imageName);

    var dockerfileContents = golang.createDockerfile();
    yo.fs.write(yo.destinationPath(DOCKERFILE_NAME), new Buffer(dockerfileContents));
    
    var dockerComposeContents = golang.createDockerComposeFile();
    yo.fs.write(yo.destinationPath(DOCKERCOMPOSE_NAME), new Buffer(dockerComposeContents));

    yo.fs.copyTpl(
        yo.templatePath(golang.getTemplateScriptName()),
        yo.destinationPath(util.getDestinationScriptName()), {
            imageName: golang.getImageName(),
            runImageCommand: golang.getContainerRunCommand(),
            openWebSiteCommand: golang.getOpenWebSiteCommand(),
        });
}

/**
 * Handles ASP.NET option.
 */
function handleAspNet(yo) {
    var aspNet = new AspNetHelper(aspNetVersion, portNumber, imageName);

    var done = yo.async();
    aspNet.addKestrelCommand(function(err, commandAdded) {
        if (err) {
            error = true;
            yo.log.error(err);
            return;
        }
        kestrelCommandAdded = commandAdded;
        done();
    }.bind(yo));

    var dockerfileContents = aspNet.createDockerfile();
    yo.fs.write(yo.destinationPath(DOCKERFILE_NAME), new Buffer(dockerfileContents));

    var dockerComposeContents = aspNet.createDockerComposeFile();
    yo.fs.write(yo.destinationPath(DOCKERCOMPOSE_NAME), new Buffer(dockerComposeContents));

    yo.fs.copyTpl(
        yo.templatePath(aspNet.getTemplateScriptName()),
        yo.destinationPath(util.getDestinationScriptName()), {
            imageName: aspNet.getImageName(),
            portNumber: aspNet.getPortNumber(),
            containerRunCommand: aspNet.getContainerRunCommand()
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

    var done = this.async();
    if (!util.isWindows()) {
        exec('chmod +x ' + util.getDestinationScriptName(), function(err) {
            if (err) {
                this.log.error(err);
                this.log.error('Error making script executable. Run ' + chalk.bold('chmod +x ' + util.getDestinationScriptName()) + ' manually.');
                error = true;
            }
            done();
        }.bind(this));
    }

    if (kestrelCommandAdded) {
        this.log('We noticed your project.json file didn\'t know how to start the kestrel web server. We\'ve fixed that for you.');
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

    var client = appInsights.getClient(AppInsightsKey)
    client.config.maxBatchIntervalMs = 1000;
    appInsights.setup(AppInsightsKey).start();

    client.trackEvent('YoDockerLaunch', {
        'version': pkg.version,
        'osPlatform': os.platform(),
        'projectType': projectType,
        'usingNodemon': addNodemon === undefined ? 'undefined' : addNodemon,
        'portNumber': portNumber,
        'imageName': imageName,
        'isGoWebProject': isGoWeb === undefined ? 'undefined' : isGoWeb,
        'aspNetVersion': aspNetVersion === undefined ? 'undefined' : aspNetVersion
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
            message: 'Generator-docker would like to collect anonymized data on the options you selected to understand and improve your experience.' +
                'To opt out later, you can delete ' + chalk.red('~/.config/configstore/' + pkg.name + '.json. ') + 'Will you help us help you and your fellow developers?',
            default: true
        };

        yo.prompt(q, function(props) {
            trackData = props.optIn;
            config.set(AppInsightsOptInName, trackData);
            
             var client = appInsights.getClient(AppInsightsKey)
             client.config.maxBatchIntervalMs = 1000;
             appInsights.setup(AppInsightsKey).start();
             
             client.trackEvent('YoDockerCollectData', {
                 'opt-in': trackData.toString()
             });
             
             appInsights.setAutoCollectPerformance(false);

            done();
        }.bind(yo));
    } else {
        trackData = config.get(AppInsightsOptInName);
    }
}

/**
 * Docker Generator.
 */
var DockerGenerator = yeoman.generators.Base.extend({
    constructor: function() {
        yeoman.generators.Base.apply(this, arguments);
    },

    init: function() {
        this.log(yosay('Welcome to the ' + chalk.red('Docker') + ' generator!' + chalk.green('\nLet\'s add Docker container magic to your app!')));
        handleAppInsights(this);
    },
    askFor: showPrompts,
    writing: function() {
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
            case 'aspnet':
                {
                    handleAspNet(this);
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
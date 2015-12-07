# Generator-docker

[![Package version][npmVersionBadge]][npmLink]
[![CI Status][ciStatusBadge]][ciLink]
[![Downloads][npmDownloadsBadge]][npmLink]

This generator creates a Dockerfile and a script (`dockerTask.sh` or `dockerTask.ps1`) that helps you build and run your project inside of a Docker container. The following project types are currently supported:
- ASP.NET 5.0
- Go 
- Node.js

### Quick demo
![nodejs-demo](images/nodejsdemo.gif)

## Longer walkthrough video
[![See the generator in action][yovideoScreenshot]][yovideo]]

## Installing

Prerequisites: 
- [Node.js][nodejsSite]
- [Yo generator][yoSite]

Install the Docker generator:
```bash
npm install -g generator-docker
```

Run the generator in the same folder that your project is in:
```bash
yo docker
```

## Contributing
See [Contributing][contributingLink] for guidelines.

## Multi-Environment and Multi-Container Compose Support - Prototype
We are working on adding docker-compose support that will support multiple containers and multiple environments.
`dockerTask compose dev` will issue a docker-compose up with the merged docker-compose files
`dockerTask compose staging` will remove the volume mapping and other debug settings

To see and provide feedback, please take a look at: [yo docker compose prototype][yodockerprototype]

## Q&A
- **Q: Are you building an abstraction layer over docker apis?**
  - **A:** No. These are your scripts. We're simply providing a starting point that docker developers would write themselves. These scripts are based on customers we've been working with
- **Q: Are you taking feedback?**
  - **A:** Of course. Please open an issue at [yodockerissues] or choose to [contribute][contributingLink]

## Collecting usage data
Generator-docker collects anonymized data on the options you selected in the tool to understand and improve the experience. You are given a choice to 
opt-in or opt-out first time you run the tool. If you opt-in and decide to opt-out later, simply delete the `~/.config/configstore/generator-docker.json` file from your machine. 

## Changelog
```
v0.0.27
=======
+ Replaced .CMD file with PowerShell script.
+ Adding .debug and .release compose files.
+ Replaced ADD command with COPY command in dockerfile.

v0.0.26
=======
+ BugFix: fixing issues with the path on Windows when using volume sharing in Node.js projects.

v0.0.25
=======
+ BugFix: making sure config is defined before reading a property.
+ BugFix: tracking if users opted-in or out for data collection.
 
v0.0.24
=======
+ Docker-compose.yml files are being created now for all project types.
```

## License
See [LICENSE][licenseLink] for full license text.

[licenseLink]:https://github.com/Microsoft/generator-docker/blob/master/LICENSE
[contributingLink]: https://github.com/Microsoft/generator-docker/blob/master/CONTRIBUTING.md
[npmLink]:https://www.npmjs.com/package/generator-docker
[npmVersionBadge]:https://img.shields.io/npm/v/generator-docker.svg
[npmDownloadsBadge]:https://img.shields.io/npm/dm/generator-docker.svg
[ciStatusBadge]:https://circleci.com/gh/Microsoft/generator-docker.svg?style=shield&circle-token=a1a705d77cd91720fdd8b021e17c41bbabc4b00d
[ciLink]: https://circleci.com/gh/Microsoft/generator-docker
[yovideo]: https://youtu.be/p1F-398z1_4
[yovideoScreenshot]: http://img.youtube.com/vi/p1F-398z1_4/0.jpg
[nodejsSite]: https://nodejs.org/en/
[yoSite]: http://yeoman.io/
[yodockerprototype]: https://github.com/SteveLasker/YoDockerComposePrototype
[yodockerissues]: https://github.com/SteveLasker/YoDockerComposePrototype/issues
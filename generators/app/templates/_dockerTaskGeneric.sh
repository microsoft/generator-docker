imageName="<%= imageName %>"
projectName="<%= composeProjectName %>"<% if (projectType === 'nodejs' || projectType === 'aspnet') { %>
serviceName="<%= serviceName %>"<% } %><% if (projectType === 'aspnet') { %>
containerName="<%= '${projectName}_${serviceName}' %>_1"<% } %>
publicPort=<%= portNumber %>
isWebProject=<%= isWebProject %>

# Kills all running containers of an image and then removes them.
cleanAll () {
    # List all running containers that use $imageName, kill them and then remove them.
    docker kill $(docker ps -a | awk '{ print $1,$2 }' | grep $imageName | awk '{ print $1}') > /dev/null 2>&1;
    docker rm $(docker ps -a | awk '{ print $1,$2 }' | grep $imageName | awk '{ print $1}') > /dev/null 2>&1;
}

# Builds the Docker image.
buildImage () {
    if [[ -z $ENVIRONMENT ]]; then
       ENVIRONMENT="debug"
    fi

    dockerFileName="Dockerfile.$ENVIRONMENT"

    if [[ ! -f $dockerFileName ]]; then
      echo "$ENVIRONMENT is not a valid parameter. File '$dockerFileName' does not exist."
    else
      taggedImageName="$imageName"
      if [[ $ENVIRONMENT != "release" ]]; then
        taggedImageName="$imageName:$ENVIRONMENT"
      fi

      echo "Building the image $imageName ($ENVIRONMENT)."
      docker build -f $dockerFileName -t $taggedImageName .
    fi
}

# Runs docker-compose.
compose () {
  if [[ -z $ENVIRONMENT ]]; then
    ENVIRONMENT="debug"
  fi

  composeFileName="docker-compose.$ENVIRONMENT.yml"

  if [[ ! -f $composeFileName ]]; then
    echo "$ENVIRONMENT is not a valid parameter. File '$composeFileName' does not exist."
  else
    echo "Running compose file $composeFileName"
    docker-compose -f $composeFileName -p $projectName kill
    docker-compose -f $composeFileName -p $projectName up -d
  fi
}<% if (projectType === 'aspnet') { %>

startDebugging () {
    echo "Running on http://$(docker-machine ip $(docker-machine active)):$publicPort"

    containerId=$(docker ps -f "name=$containerName" -q -n=1)
    if [[ z $containerId ]]; then
      echo "Could not find a container named $containerName"
    else
      docker exec -i $containerId /clrdbg/clrdbg --interpreter=mi
    fi

}<% } %>

openSite () {
    printf 'Opening site'
    until $(curl --output /dev/null --silent --head --fail http://$(docker-machine ip $(docker-machine active)):$publicPort); do
      printf '.'
      sleep 1
    done

    # Open the site.
    open "http://$(docker-machine ip $(docker-machine active)):$publicPort"
}

# Shows the usage for the script.
showUsage () {
    echo "Usage: dockerTask.sh [COMMAND] (ENVIRONMENT)"
    echo "    Runs build or compose using specific environment (if not provided, debug environment is used)"
    echo ""
    echo "Commands:"
    echo "    build: Builds a Docker image ('$imageName')."
    echo "    compose: Runs docker-compose."
    echo "    clean: Removes the image '$imageName' and kills all containers based on that image."<% if (projectType === 'nodejs' || projectType === 'aspnet') { %>
    echo "    composeForDebug: Builds the image and runs docker-compose."<% } %><% if (projectType === 'aspnet') { %>
    echo "    startDebugging: Finds the running container and starts the debugger inside of it."<% } %>
    echo ""
    echo "Environments:"
    echo "    debug: Uses debug environment for build and/or compose."
    echo "    release: Uses release environment for build and/or compose."
    echo ""
    echo "Example:"
    echo "    ./dockerTask.sh build debug"
    echo ""
    echo "    This will:"
    echo "        Build a Docker image named $imageName using debug environment."
}

if [ $# -eq 0 ]; then
  showUsage
else
  case "$1" in
      "compose")
             ENVIRONMENT=$2
             compose
             if [[ $isWebProject = true ]]; then
               openSite
             fi
             ;;<% if (projectType === 'nodejs' || projectType === 'aspnet') { %>
      "composeForDebug")
             ENVIRONMENT=$2
             export REMOTE_DEBUGGING=1
             buildImage
             compose
             ;;<% } %><% if (projectType === 'aspnet') { %>
      "startDebugging")
             startDebugging
             ;;<% } %>
      "build")
             ENVIRONMENT=$2
             buildImage
             ;;
      "clean")
             cleanAll
             ;;
      *)
             showUsage
             ;;
  esac
fi
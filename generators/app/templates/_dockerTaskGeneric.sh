imageName="<%= imageName %>"
projectName="<%= composeProjectName %>"<% if (includeStartDebugging) { %>
serviceName="<%= serviceName %>"
containerName="<%= '${projectName}_${serviceName}' %>_1"<% } %><% if (isWebProject) { %>
publicPort=<%= portNumber %>
url="http://localhost:$publicPort"<% } %><% if (projectType === 'dotnet' && (dotnetVersion === 'RC2' || dotnetVersion === 'RTM')) { %>
runtimeID="debian.8-x64"
framework="netcoreapp1.0"<% } %>

# Kills all running containers of an image and then removes them.
cleanAll () {
  if [[ -z $ENVIRONMENT ]]; then
    ENVIRONMENT="debug"
  fi

  composeFileName="docker-compose.yml"
  if [[ $ENVIRONMENT != "release" ]]; then
    composeFileName="docker-compose.$ENVIRONMENT.yml"
  fi

  if [[ ! -f $composeFileName ]]; then
    echo "$ENVIRONMENT is not a valid parameter. File '$composeFileName' does not exist."
  else
    docker-compose -f $composeFileName -p $projectName down --rmi all

    # Remove any dangling images (from previous builds)
    danglingImages=$(docker images -q --filter 'dangling=true')
    if [[ ! -z $danglingImages ]]; then
      docker rmi -f $danglingImages
    fi
  fi
}

# Builds the Docker image.
buildImage () {
  if [[ -z $ENVIRONMENT ]]; then
    ENVIRONMENT="debug"
  fi

  composeFileName="docker-compose.yml"
  if [[ $ENVIRONMENT != "release" ]]; then
    composeFileName="docker-compose.$ENVIRONMENT.yml"
  fi

  if [[ ! -f $composeFileName ]]; then
    echo "$ENVIRONMENT is not a valid parameter. File '$composeFileName' does not exist."
  else<% if (projectType === 'dotnet' && (dotnetVersion === 'RC2' || dotnetVersion === 'RTM')) { %>
    echo "Building the project ($ENVIRONMENT)."
    pubFolder="bin/$ENVIRONMENT/$framework/publish"
    dotnet publish -f $framework -r $runtimeID -c $ENVIRONMENT -o $pubFolder

    echo "Building the image $imageName ($ENVIRONMENT)."
    docker-compose -f "$pubFolder/$composeFileName" -p $projectName build<% } else { %>
    echo "Building the image $imageName ($ENVIRONMENT)."
    docker-compose -f $composeFileName -p $projectName build<% } %>
  fi
}

# Runs docker-compose.
compose () {
  if [[ -z $ENVIRONMENT ]]; then
    ENVIRONMENT="debug"
  fi

  composeFileName="docker-compose.yml"
  if [[ $ENVIRONMENT != "release" ]]; then
      composeFileName="docker-compose.$ENVIRONMENT.yml"
  fi

  if [[ ! -f $composeFileName ]]; then
    echo "$ENVIRONMENT is not a valid parameter. File '$composeFileName' does not exist."
  else
    echo "Running compose file $composeFileName"
    docker-compose -f $composeFileName -p $projectName kill
    docker-compose -f $composeFileName -p $projectName up -d
  fi
}<% if (includeStartDebugging) { %>

startDebugging () {<% if (isWebProject) { %>
  echo "Running on $url"
<% } %>
  containerId=$(docker ps -f "name=$containerName" -q -n=1)
  if [[ -z $containerId ]]; then
    echo "Could not find a container named $containerName"
  else
    docker exec -i $containerId /clrdbg/clrdbg --interpreter=mi
  fi

}<% } %><% if (isWebProject) { %>

openSite () {
  printf 'Opening site'
  until $(curl --output /dev/null --silent --fail $url); do
    printf '.'
    sleep 1
  done

  # Open the site.
  case "$OSTYPE" in
    darwin*) open $url ;;
    linux*) xdg-open $url ;;
    *) printf "\nUnable to open site on $OSTYPE" ;;
  esac
}<% } %>

# Shows the usage for the script.
showUsage () {
  echo "Usage: dockerTask.sh [COMMAND] (ENVIRONMENT)"
  echo "    Runs build or compose using specific environment (if not provided, debug environment is used)"
  echo ""
  echo "Commands:"
  echo "    build: Builds a Docker image ('$imageName')."
  echo "    compose: Runs docker-compose."
  echo "    clean: Removes the image '$imageName' and kills all containers based on that image."<% if (includeComposeForDebug) { %>
  echo "    composeForDebug: Builds the image and runs docker-compose."<% } %><% if (includeStartDebugging) { %>
  echo "    startDebugging: Finds the running container and starts the debugger inside of it."<% } %>
  echo ""
  echo "Environments:"
  echo "    debug: Uses debug environment."
  echo "    release: Uses release environment."
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
            ENVIRONMENT=$(echo $2 | tr "[:upper:]" "[:lower:]")
            compose<% if (isWebProject) { %>
            openSite<% } %>
            ;;<% if (includeComposeForDebug) { %>
    "composeForDebug")
            ENVIRONMENT=$(echo $2 | tr "[:upper:]" "[:lower:]")
            export REMOTE_DEBUGGING=1
            buildImage
            compose
            ;;<% } %><% if (includeStartDebugging) { %>
    "startDebugging")
            startDebugging
            ;;<% } %>
    "build")
            ENVIRONMENT=$(echo $2 | tr "[:upper:]" "[:lower:]")
            buildImage
            ;;
    "clean")
            ENVIRONMENT=$(echo $2 | tr "[:upper:]" "[:lower:]")
            cleanAll
            ;;
    *)
            showUsage
            ;;
  esac
fi
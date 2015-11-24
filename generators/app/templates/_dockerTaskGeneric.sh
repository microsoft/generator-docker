imageName="<%= imageName %>"
containerPort=<%= portNumber %>
publicPort=<%= portNumber %>

# Kills all running containers of an image and then removes them.
cleanAll () {
    # List all running containers that use $imageName, kill them and then remove them.
    docker kill $(docker ps -a | awk '{ print $1,$2 }' | grep $imageName | awk '{ print $1}') > /dev/null 2>&1;
    docker rm $(docker ps -a | awk '{ print $1,$2 }' | grep $imageName | awk '{ print $1}') > /dev/null 2>&1;
}

# Builds the Docker image.
buildImage () {
    echo "Building the image $imageName."
    docker build -t $imageName .
}

# Runs docker-compose.
compose () {
  echo "Composing."
  docker-compose up -d
  _openSite
}

# Runs the container.
runContainer () {
    # Check if container is already running, stop it and run a new one.
    docker kill $(docker ps -a | awk '{ print $1,$2 }' | grep $imageName | awk '{ print $1}') > /dev/null 2>&1;

    # Create a container from the image.
    <%= containerRunCommand %>
}

_openSite () {
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
    echo "Description:"
    echo "    Builds and runs a Docker image."
    echo ""
    echo "Options:"
    echo "    build: Builds a Docker image ('$imageName')."
    echo "    run: Runs a container based on an existing Docker image ('$imageName')."
    echo "    buildrun: Builds a Docker image and runs the container."
    echo "    compose: Runs docker-compose."
    echo "    clean: Removes the image '$imageName' and kills all containers based on that image."
    echo ""
    echo "Example:"
    echo "    ./dockerTask.sh build"
    echo ""
    echo "    This will:"
    echo "        Build a Docker image named $imageName."
}

if [ $# -eq 0 ]; then
  showUsage
else
  case "$1" in
      "compose")
             compose
             ;;
      "build")
             buildImage
             ;;
      "run")
             runContainer
             ;;
      "clean")
             cleanAll
             ;;
      "buildrun")
             buildImage
             runContainer
             ;;
      *)
             showUsage
             ;;
  esac
fi
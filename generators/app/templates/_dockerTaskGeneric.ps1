<#
.SYNOPSIS
Builds and runs a Docker image.
.PARAMETER Compose
Runs docker-compose.
.PARAMETER Build
Builds a Docker image.
.PARAMETER Clean
Removes the image <%= imageName %> and kills all containers based on that image.
.PARAMETER Environment
The enviorment to build for (Debug or Release), defaults to Debug
.EXAMPLE
C:\PS> .\dockerTask.ps1 -Build
Build a Docker image named <%= imageName %>
#>

Param(
    [Parameter(Mandatory=$True,ParameterSetName="Compose")]
    [switch]$Compose,
    [Parameter(Mandatory=$True,ParameterSetName="Build")]
    [switch]$Build,
    [Parameter(Mandatory=$True,ParameterSetName="Clean")]
    [switch]$Clean,
    [parameter(ParameterSetName="Compose")]
    [parameter(ParameterSetName="Build")]
    [ValidateNotNullOrEmpty()]
    [String]$Environment = "Debug"
)

$imageName="<%= imageName %>"
$publicPort=<%= portNumber %>
$isWebProject=$<%= isWebProject %>

# Kills all running containers of an image and then removes them.
function CleanAll () {
    # List all running containers that use $imageName, kill them and then remove them.
    docker ps -a | select-string -pattern $serviceName | foreach { $containerId =  $_.ToString().split()[0]; docker kill $containerId *>&1 | Out-Null; docker rm $containerId *>&1 | Out-Null }
}

# Builds the Docker image.
function BuildImage () {
    $dockerFileName="Dockerfile.$Environment"

    if (Test-Path $dockerFileName) {
        $taggedImageName = $imageName
        if ($Environment -ne "Release") {
            $taggedImageName = "<%- '${imageName}:$Environment' %>"
        }

        Write-Host "Building the image $imageName ($Environment)."
        docker build -f $dockerFileName -t $taggedImageName .
    }
    else {
        Write-Error -Message "$Environment is not a valid parameter. File '$dockerFileName' does not exist." -Category InvalidArgument
    }
}

# Runs docker-compose.
function Compose () {
    $composeFileName="docker-compose.$Environment.yml"

    if (Test-Path $composeFileName) {
        Write-Host "Running compose file $composeFileName"
        docker-compose -f $composeFileName kill
        docker-compose -f $composeFileName up -d

        if ($isWebProject) {
            OpenSite
        }
    }
    else {
        Write-Error -Message "$Environment is not a valid parameter. File '$dockerFileName' does not exist." -Category InvalidArgument
    }
}

# Opens the remote site
function OpenSite () {
    Write-Host "Opening site" -NoNewline
    $status = 0

    #Check if the site is available
    while($status -ne 200) {
        try {
            $response = Invoke-WebRequest -Uri "http://$(docker-machine ip $(docker-machine active)):$publicPort" -Headers @{"Cache-Control"="no-cache";"Pragma"="no-cache"} -UseBasicParsing
            $status = [int]$response.StatusCode
        }
        catch [System.Net.WebException] { }
        if($status -ne 200) {
            Write-Host "." -NoNewline
            Start-Sleep 1
        }
    }

    Write-Host
    # Open the site.
    Start-Process "http://$(docker-machine ip $(docker-machine active)):$publicPort"
}

# Call the correct function for the parameter that was used
if($Compose) {
    Compose
}
elseif($Build) {
    BuildImage
}
elseif ($Clean) {
    CleanAll
}
<#
.SYNOPSIS
Builds and runs a Docker image.
.PARAMETER Compose
Runs docker-compose.
.PARAMETER Build
Builds a Docker image.
.PARAMETER Clean
Removes the image <%= imageName %> and kills all containers based on that image.<% if (projectType === 'nodejs' || (projectType === 'dotnet' && dotnetVersion === 'RC2')) { %>
.PARAMETER ComposeForDebug
Builds the image and runs docker-compose.<% } %><% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
.PARAMETER StartDebugging
Finds the running container and starts the debugger inside of it.<% } %>
.PARAMETER Environment
The enviorment to build for (Debug or Release), defaults to Debug
.EXAMPLE
C:\PS> .\dockerTask.ps1 -Build
Build a Docker image named <%= imageName %>
#>

Param(
    [Parameter(Mandatory=$True,ParameterSetName="Compose")]
    [switch]$Compose,<% if (projectType === 'nodejs' || (projectType === 'dotnet' && dotnetVersion === 'RC2')) { %>
    [Parameter(Mandatory=$True,ParameterSetName="ComposeForDebug")]
    [switch]$ComposeForDebug,<% } %><% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
    [Parameter(Mandatory=$True,ParameterSetName="StartDebugging")]
    [switch]$StartDebugging,<% } %>
    [Parameter(Mandatory=$True,ParameterSetName="Build")]
    [switch]$Build,
    [Parameter(Mandatory=$True,ParameterSetName="Clean")]
    [switch]$Clean,
    [parameter(ParameterSetName="Compose")]<% if (projectType === 'nodejs' || (projectType === 'dotnet' && dotnetVersion === 'RC2')) { %>
    [Parameter(ParameterSetName="ComposeForDebug")]<% } %>
    [parameter(ParameterSetName="Build")]
    [ValidateNotNullOrEmpty()]
    [String]$Environment = "Debug"
)

$imageName="<%= imageName %>"
$projectName="<%= composeProjectName %>"<% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
$serviceName="<%= serviceName %>"
$containerName="<%= '${projectName}_${serviceName}' %>_1"<% } %>
$publicPort=<%= portNumber %>
$isWebProject=$<%= isWebProject %>
$url="http://docker:$publicPort"<% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
$runtimeID = "debian.8-x64"
$framework = "netcoreapp1.0"<% } %>

# Kills all running containers of an image and then removes them.
function CleanAll () {
    # List all running containers that use $imageName, kill them and then remove them.
    docker ps -a | select-string -pattern $imageName | foreach { $containerId =  $_.ToString().split()[0]; docker kill $containerId *>&1 | Out-Null; docker rm $containerId *>&1 | Out-Null }
}

# Builds the Docker image.
function BuildImage () {
    $dockerFileName = "Dockerfile"
    $taggedImageName = $imageName
    if ($Environment -ne "Release") {
        $dockerFileName = "Dockerfile.$Environment"
        $taggedImageName = "<%- '${imageName}:$Environment' %>".ToLowerInvariant()
    }

    if (Test-Path $dockerFileName) {<% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
        Write-Host "Building the project ($ENVIRONMENT)."
        $pubFolder = "bin\$Environment\$framework\publish"
        dotnet publish -f $framework -r $runtimeID -c $Environment -o $pubFolder

        Write-Host "Building the image $imageName ($Environment)."
        docker build -f "$pubFolder\$dockerFileName" -t $taggedImageName $pubFolder<% } else { %>
        Write-Host "Building the image $imageName ($Environment)."
        docker build -f $dockerFileName -t $taggedImageName .<% } %>
    }
    else {
        Write-Error -Message "$Environment is not a valid parameter. File '$dockerFileName' does not exist." -Category InvalidArgument
    }
}

# Runs docker-compose.
function Compose () {
    $composeFileName = "docker-compose.yml"
    if ($Environment -ne "Release") {
        $composeFileName = "docker-compose.$Environment.yml"
    }

    if (Test-Path $composeFileName) {
        Write-Host "Running compose file $composeFileName"
        docker-compose -f $composeFileName -p $projectName kill
        docker-compose -f $composeFileName -p $projectName up -d
    }
    else {
        Write-Error -Message "$Environment is not a valid parameter. File '$dockerFileName' does not exist." -Category InvalidArgument
    }
}<% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>

function StartDebugging () {
    Write-Host "Running on $url"

    $containerId = (docker ps -f "name=$containerName" -q -n=1)
    if ([System.String]::IsNullOrWhiteSpace($containerId)) {
        Write-Error "Could not find a container named $containerName"
    }

    docker exec -i $containerId /clrdbg/clrdbg --interpreter=mi
}<% } %>

# Opens the remote site
function OpenSite () {
    Write-Host "Opening site" -NoNewline
    $status = 0

    #Check if the site is available
    while($status -ne 200) {
        try {
            $response = Invoke-WebRequest -Uri $url -Headers @{"Cache-Control"="no-cache";"Pragma"="no-cache"} -UseBasicParsing
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
    Start-Process $url
}

# Call the correct function for the parameter that was used
if($Compose) {
    Compose
    if ($isWebProject) {
        OpenSite
    }
}<% if (projectType === 'nodejs' || (projectType === 'dotnet' && dotnetVersion === 'RC2')) { %>
elseif($ComposeForDebug) {
    $env:REMOTE_DEBUGGING = 1
    BuildImage
    Compose
}<% } %><% if (projectType === 'dotnet' && dotnetVersion === 'RC2') { %>
elseif($StartDebugging) {
    StartDebugging
}<% } %>
elseif($Build) {
    BuildImage
}
elseif ($Clean) {
    CleanAll
}
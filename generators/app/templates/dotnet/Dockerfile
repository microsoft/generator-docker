FROM <%= baseImageName %>
COPY project.json /app/
WORKDIR /app
RUN ["dotnet", "restore"]
COPY . /app
RUN ["dotnet", "build", "-c", "<%= environment %>"]
EXPOSE <%= portNumber %>
ENTRYPOINT ["dotnet", "run"]

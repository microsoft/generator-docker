FROM <%= environment === 'debug' ? debugBaseImageName : releaseBaseImageName %>
COPY project.json /app/
WORKDIR /app
RUN ["dnu", "restore"]
COPY . /app
EXPOSE <%= portNumber %>
ENTRYPOINT ["dnx", "-p", "project.json", "web"]

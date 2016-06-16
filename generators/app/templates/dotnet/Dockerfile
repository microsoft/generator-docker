FROM <%= baseImageName %>
ENV NUGET_XMLDOC_MODE skip<% if (environment === 'debug') { %>
ARG CLRDBG_VERSION=VS2015U2
ADD https://raw.githubusercontent.com/Microsoft/MIEngine/getclrdbg-release/scripts/GetClrDbg.sh /clrdbg/
WORKDIR /clrdbg
RUN chmod 700 GetClrDbg.sh
RUN ./GetClrDbg.sh $CLRDBG_VERSION<% } %>
COPY project.json /app/
WORKDIR /app
RUN ["dotnet", "restore"]
COPY . /app
RUN ["dotnet", "build", "-c", "<%= environment %>"]
EXPOSE <%= portNumber %><% if (environment === 'debug') { %>
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then dotnet run -c <%= environment %>; else sleep infinity; fi"]<% } else { %>
ENTRYPOINT ["dotnet", "run", "-c", "<%= environment %>"]<% } %>

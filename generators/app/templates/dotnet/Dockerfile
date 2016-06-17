FROM <%= environment === 'debug' ? debugBaseImageName : releaseBaseImageName %><% if (environment === 'debug') { %>
ENV NUGET_XMLDOC_MODE skip
ARG CLRDBG_VERSION=VS2015U2
ADD https://raw.githubusercontent.com/Microsoft/MIEngine/getclrdbg-release/scripts/GetClrDbg.sh /clrdbg/
WORKDIR /clrdbg
RUN chmod 700 GetClrDbg.sh
RUN ./GetClrDbg.sh $CLRDBG_VERSION<% } %>
WORKDIR /app
COPY . /app
EXPOSE <%= portNumber %><% if (environment === 'debug') { %>
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then dotnet <%= outputName %>; else sleep infinity; fi"]<% } else { %>
ENTRYPOINT ["dotnet", "<%= outputName %>"]<% } %>

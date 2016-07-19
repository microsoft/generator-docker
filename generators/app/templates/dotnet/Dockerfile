FROM <%= environment === 'debug' ? debugBaseImageName : releaseBaseImageName %><% if (environment === 'debug') { %>
ENV NUGET_XMLDOC_MODE skip
ARG CLRDBG_VERSION=VS2015U2
WORKDIR /clrdbg
RUN curl -SL https://raw.githubusercontent.com/Microsoft/MIEngine/getclrdbg-release/scripts/GetClrDbg.sh --output GetClrDbg.sh \
    && chmod 700 GetClrDbg.sh \
    && ./GetClrDbg.sh $CLRDBG_VERSION \
    && rm GetClrDbg.sh<% } %>
WORKDIR /app<% if (isWebProject) { %><% if (dotnetVersion === 'RTM') { %>
ENV ASPNETCORE_URLS http://*:<%= portNumber %><% } %>
EXPOSE <%= portNumber %><% } %><% if (environment === 'debug') { %>
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then dotnet <%= outputName %>; else sleep infinity; fi"]<% } else { %>
ENTRYPOINT ["dotnet", "<%= outputName %>"]<% } %>
COPY . /app

FROM node<% if (environment === 'debug') { %>
RUN npm install nodemon -g<% } %>
WORKDIR /src<% if (isWebProject) { %>
EXPOSE <%= portNumber %><% } %><% if (environment === 'debug') { %>
EXPOSE 5858
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]<% } else { %>
ENTRYPOINT ["npm", "start"]<% } %>
COPY . /src
RUN npm install

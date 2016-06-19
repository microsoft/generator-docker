FROM node
WORKDIR /src
COPY package.json .
RUN npm install
EXPOSE 3000<% if (environment === 'debug') { %>
RUN npm install nodemon -g
EXPOSE 5858
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]<% } else { %>
ENTRYPOINT ["node", "server.js"]<% } %>
COPY . .

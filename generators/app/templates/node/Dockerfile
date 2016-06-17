FROM node<% if (environment === 'debug') { %>
RUN npm install nodemon -g<% } %>
RUN mkdir /src
COPY package.json /src
RUN npm install
COPY . /src
WORKDIR /src
EXPOSE <%= portNumber %><% if (environment === 'debug') { %>
EXPOSE 5858
ENTRYPOINT ["/bin/bash", "-c", "if [ -z \"$REMOTE_DEBUGGING\" ]; then nodemon -L --debug; else nodemon -L --debug-brk; fi"]<% } else { %>
CMD ["node", "./bin/www"]<% } %>

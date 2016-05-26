FROM node<% if (environment === 'debug') { %>
RUN npm install nodemon -g<% } %>
RUN mkdir /src
COPY package.json /src
RUN npm install
COPY . /src
WORKDIR /src
EXPOSE <%= portNumber %><% if (environment === 'debug') { %>
CMD ["nodemon"]<% } else { %>
CMD ["node", "./bin/www"]<% } %>

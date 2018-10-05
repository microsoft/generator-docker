FROM golang AS build-stage
COPY . /go/src/github.com/<%= projectName %>
RUN go install github.com/<%= projectName %>

FROM alpine
WORKDIR /app
COPY --from=build-stage /go/bin/<%= projectName %> /app/
ENTRYPOINT /app/<%= projectName %>
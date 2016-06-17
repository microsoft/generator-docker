FROM golang
COPY . /go/src/github.com/<%= projectName %>
RUN go install github.com/<%= projectName %>
ENTRYPOINT /go/bin/<%= projectName %>

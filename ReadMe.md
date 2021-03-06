#DataBridge Logger

## Environment variables

- DATABRIDGE_KEY (optional): key for HTTPS
- DATABRIDGE_CERTIFICATE (optional): certificate for https
- NODE_PORT (optional), default is 3000 : port on which server operates
- DATABRIDGE_LOGFILE_EXTENSION (optional), default is '.log' : extension of logfile
- DATABRIDGE_LOGFOLDER (optional), default is './logs' : folder to store logs
- DATABRIDGE_LOG_ROTATION_TIME (optional), default is 1800 : time between log rotations [s]
- DATABRIDGE_LOGGER_TCP_HOST (optional), if set enable TCP backend to this host
- DATABRIDGE_LOGGER_TCP_PORT (optional), if set enable TCP backend to this port (the two need to be defined)
- DATABRIDGE_HUB_GRAPHQL (optional), URL to the graphql server for storing the analysed data

## Protocol

This logging server accepts an **array** of `JSON` messages through HTTP/s Protocol.

The domain of valid `JSON` messages are defined in `./src/logSchema.json` (A JSON-Schema descriptor)

## Container Docker

This repo is available as a Docker Container

### Build this container
(In the repo folder)
**Warning**: The docker container only listen __HTTP__, you will need to put an HTTPS accelerator in front of this container

```bash
docker build -t databridge-logger .
```

### Run this container

replace `9999` by whatever port you want to container to listen to

```bash
docker run -d -p 9999:80 databridge-logger
```

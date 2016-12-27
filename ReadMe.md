**Environment variables**

- DATABRIDGE_KEY (optional): key for HTTPS
- DATABRIDGE_CERTIFICATE (optional): certificate for https
- NODE_PORT (optional), default is 3000 : port on which server operates
- DATABRIDGE_LOGFILE (optional), default is './all.log' : name and path of logfile

**Protocol**

This logging server accepts `JSON` messages through HTTP/s Protocol.

The domain of valid `JSON` messages are defined in `./src/logSchema.json` (A JSON-Schema descriptor)

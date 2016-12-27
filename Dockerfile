FROM node:7
RUN npm install -g yarn
WORKDIR logger

ADD ./server.js ./server.js
EXPOSE 80
ENV NODE_PORT 80
ADD ./yarn.lock ./yarn.lock
ADD ./package.json ./package.json
ADD ./.babelrc ./.babelrc
RUN yarn 
ADD ./src ./src
CMD node server.js


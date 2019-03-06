# Base image with api sources only
FROM node:8-alpine AS base
WORKDIR /home/node/scheduled-tasks

COPY /config ./config
COPY /src ./src
COPY /package.json ./
EXPOSE 3000
RUN export NODE_ENV=docker

# Image for building
FROM base AS dependencies
RUN apk add --no-cache make gcc g++ python
COPY spec ./spec
COPY .eslintrc.js ./
COPY package-lock.json ./

EXPOSE 3000

RUN npm install
RUN npm prune --production

CMD ["npm", "start"]
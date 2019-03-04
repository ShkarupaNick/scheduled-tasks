# Base image with api sources only
FROM node:8-alpine AS base
WORKDIR /home/node/scheduled-tasks

COPY /config ./config
COPY /src ./src
COPY /package.json ./

# Image for building
FROM base AS dependencies
RUN apk add --no-cache make gcc g++ python
COPY spec ./spec
COPY .eslintrc.js ./
COPY package-lock.json ./

EXPOSE 3000

# Run tests
RUN npm install
RUN npm run intTest
RUN npm prune --production

# Release image for running microservice
FROM base AS release
COPY --from=dependencies /home/node/scheduled-tasks/node_modules ./node_modules
RUN chown -R node:node /home/node
USER node
CMD ["npm", "start"]
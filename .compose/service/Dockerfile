FROM node:12.18.4-alpine3.12
ARG SERVICE
COPY . /home/src
WORKDIR /home/src
RUN NODE_ENV=development npm install && \
    npm run build ${SERVICE} && \
    npm prune --production
USER 1001:0
ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

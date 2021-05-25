FROM node:12.18.4-alpine3.12
ARG SERVICE
WORKDIR /home/src
COPY ./package.json ./package-lock.json /home/src/
RUN npm ci -D
COPY . /home/src
RUN npm run build ${SERVICE}
USER 1001:0
ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

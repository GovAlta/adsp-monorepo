FROM node:12.18.4-alpine3.12
WORKDIR /home/src
COPY ./package.json ./package-lock.json /home/src/
RUN npm ci -D
COPY . /home/src

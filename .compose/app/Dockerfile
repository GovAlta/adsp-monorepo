ARG SERVICE
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:12.18.4-alpine3.12 as build-stage
ARG SERVICE
WORKDIR /home/src
COPY ./package.json ./package-lock.json /home/src/
RUN npm ci -D
COPY . /home/src
RUN npm run build ${SERVICE}

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx
ARG SERVICE
ENV SERVICE ${SERVICE}
COPY --from=build-stage /home/src/dist/apps/${SERVICE}/ /opt/app-root/src
COPY --from=build-stage /home/src/dist/apps/${SERVICE}/nginx.conf /etc/nginx/nginx.conf

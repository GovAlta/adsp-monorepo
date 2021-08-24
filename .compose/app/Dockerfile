ARG SERVICE
# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM adsp-base:latest as build-stage
ARG SERVICE
COPY . /home/src
RUN npm run build ${SERVICE}

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx
ARG SERVICE
ENV SERVICE ${SERVICE}
COPY --from=build-stage /home/src/dist/apps/${SERVICE}/ /opt/app-root/src
COPY --from=build-stage /home/src/dist/apps/${SERVICE}/nginx.conf /etc/nginx/nginx.conf

FROM registry.redhat.io/rhel9/nodejs-20

COPY . .
COPY ./dist/apps/content-service ./apps/content-service/dist


WORKDIR /opt/app-root/src/apps/content-service
USER 0
RUN npm ci

USER 1001:0
CMD npm run start

# FROM registry.redhat.io/rhel9/nodejs-20
FROM quay.io/fedora/nodejs-24

COPY --chown=1001:0 --chmod=777 . .
COPY --chown=1001:0 --chmod=777 ./dist/apps/content-service ./apps/content-service/dist


WORKDIR /opt/app-root/src/apps/content-service
USER 0
RUN npm ci

USER 1001:0
CMD npm run start

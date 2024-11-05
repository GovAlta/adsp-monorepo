FROM registry.redhat.io/rhel9/nodejs-20

COPY . .
COPY ./dist/apps/content-service ./apps/content-service/dist

WORKDIR /opt/app-root/src/apps/content-service
RUN npm ci

CMD npm run start

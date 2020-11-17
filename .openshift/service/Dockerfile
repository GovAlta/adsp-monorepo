FROM registry.access.redhat.com/ubi8/nodejs-12

ARG SERVICE
COPY . .

Run npm install -g @nrwl/cli
ENV SERVICE ${SERVICE}

CMD npm run -d service dist/apps/${SERVICE}/main.js

FROM adsp-base:latest
ARG SERVICE
COPY . /home/src
RUN npm run build ${SERVICE}
RUN npm prune --production
USER 1001:0
ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

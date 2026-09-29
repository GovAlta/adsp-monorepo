FROM registry.access.redhat.com/ubi9/nodejs-24

ENV NODE_ENV=production
ENV PORT=3333

WORKDIR /opt/app-root/src

COPY --chown=1001:0 . .

RUN npm install --omit=dev --no-package-lock

USER 1001

EXPOSE 3333

CMD ["node", "src/main-http.js"]

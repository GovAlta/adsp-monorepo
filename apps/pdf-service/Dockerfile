FROM node:24

USER 0

ARG SERVICE
COPY . .

# Install the chrome for the puppeteer
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to the system Chrome installed above via apt-get.
ENV HOME=/puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN chmod 777 -R dist node_modules /puppeteer

USER 1001:0

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

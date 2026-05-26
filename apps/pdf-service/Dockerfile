FROM node:24

USER 0

ARG SERVICE
COPY . .

# Install Chrome via direct .deb download — avoids apt repo/signing key issues on Debian Bookworm (node:24).
RUN apt-get update \
  && apt-get install -y wget fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && wget -q -O /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get install -y /tmp/google-chrome.deb \
  && rm /tmp/google-chrome.deb \
  && rm -rf /var/lib/apt/lists/*

# Point Puppeteer to the system Chrome installed above via apt-get.
ENV HOME=/puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
RUN mkdir -p /puppeteer && chmod 777 -R dist node_modules /puppeteer

USER 1001:0

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

# TODO: Sort out subscription entitlement for RHEL8 install of Chrome.
# FROM registry.redhat.io/rhel8/nodejs-16

# USER 0

# SHELL ["/bin/bash", "-c"]
# RUN echo $'[google-chrome]\n\
# name=google-chrome\n\
# baseurl=http://dl.google.com/linux/chrome/rpm/stable/$basearch\n\
# enabled=1\n\
# gpgcheck=1\n\
# gpgkey=https://dl-ssl.google.com/linux/linux_signing_key.pub' > /etc/yum.repos.d/google-chrome.repo

# RUN yum makecache \
#   && yum install -y google-chrome-stable libXScrnSaver
# # fipa-gothic-fonts wqy-zenhei-fonts thai-scalable-tlwgtypo-fonts kacst-one-fonts fonts-freefont-ttf

FROM node:16-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

USER 1001:0

ARG SERVICE
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

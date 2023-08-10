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

FROM node:16.20.0
# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
  && apt-get install -y gnupg \
  && apt-get install -y fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install the chrome for the puppeteer
# A chrome binary will be installed at /puppeteer/.cache/puppeteer/chrome.
# We neeed to set the WORKDIR to run the `npm i` command.
WORKDIR /usr/app
# Puppeteer will check the $HOME/.cache for the chome.
ENV HOME=/puppeteer
# Puppeteer version shall be compatible with that in the package.json. Shall we add an arg here?
RUN npm i puppeteer@20.9.0
# To avoid the potential OpenShift contianer permission issue.
RUN chmod 777 -R /puppeteer

USER 1001:0

# COPY command shall run after the `npm i` command. Otherwise, the presence of the node_modules folder will prevent the chrome installment.
COPY . .

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

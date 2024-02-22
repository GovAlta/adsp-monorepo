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

FROM node:20

USER 0

RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
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

ARG SERVICE

RUN mkdir .npm

# COPY command shall run after the `npm i` command. Otherwise, the presence of the node_modules folder will prevent the chrome installment.
COPY . .
RUN chmod 777 -R dist node_modules .npm

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

FROM node:24

USER 0

ARG SERVICE
COPY . .

# Install Chrome system library dependencies.
# Fonts and libs required by Chrome for Testing (bundled via puppeteer browsers install).
RUN apt-get update \
  && apt-get install -y \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install Chrome for Testing — version is automatically derived from the puppeteer package in
# node_modules/puppeteer-core/lib/cjs/puppeteer/revisions.js, so it stays in sync with
# whatever puppeteer version is installed. Uses the local binary to avoid npx prompt issues.
ENV HOME=/puppeteer
RUN node_modules/.bin/puppeteer browsers install chrome
RUN chmod 777 -R dist node_modules /puppeteer

USER 1001:0

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

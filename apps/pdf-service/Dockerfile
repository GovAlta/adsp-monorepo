FROM node:24

USER 0

ARG SERVICE
COPY . .

# Install Chrome system library dependencies and unzip for reliable extraction.
# Fonts and libs required by Chrome for Testing (bundled via puppeteer browsers install).
RUN apt-get update \
  && apt-get install -y \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    libasound2 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 \
    libdrm2 libgbm1 libglib2.0-0 libnss3 libnspr4 libpango-1.0-0 \
    libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
    libxkbcommon0 libxrandr2 libxshmfence1 libxss1 \
    unzip \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install Chrome for Testing — version is automatically derived from the puppeteer package in
# node_modules/puppeteer-core/lib/cjs/puppeteer/revisions.js, so it stays in sync with
# whatever puppeteer version is installed. Uses the local binary to avoid npx prompt issues.
# The yauzl-based extraction can silently fail for large binaries in buildah overlay builds,
# so we fall back to system unzip if the chrome binary is missing after install.
ENV HOME=/puppeteer
RUN node_modules/.bin/puppeteer browsers install chrome \
  && CHROME_DIR=$(find /puppeteer/.cache/puppeteer/chrome -maxdepth 1 -name 'linux-*' -type d | head -1) \
  && if [ ! -f "$CHROME_DIR/chrome-linux64/chrome" ]; then \
       ZIP=$(find /puppeteer/.cache/puppeteer/chrome -name '*-chrome-linux64.zip' | head -1) \
       && unzip -o "$ZIP" -d "$CHROME_DIR" \
       && echo "Fallback extraction used for Chrome binary"; \
     fi \
  && test -f "$CHROME_DIR/chrome-linux64/chrome" \
  && rm -f /puppeteer/.cache/puppeteer/chrome/*-chrome-linux64.zip
RUN chmod 777 -R dist node_modules /puppeteer

USER 1001:0

ENV SERVICE ${SERVICE}
CMD npm run -d service dist/apps/${SERVICE}/main.js

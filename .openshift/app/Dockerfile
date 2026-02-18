FROM registry.access.redhat.com/ubi9/nginx-120:latest

ARG SERVICE

# Copy shared nginx location configs (security, gzip, caching, SPA fallback)
COPY --chown=1001:0 .openshift/app/nginx.default.d/*.conf "${NGINX_DEFAULT_CONF_PATH}"

# Copy all application files to serve directory
COPY --chown=1001:0 dist/apps/${SERVICE}/ ./

# Move api.conf to nginx config path if it exists
RUN if [ -f api.conf ]; then mv api.conf "${NGINX_DEFAULT_CONF_PATH}/50-api.conf"; fi

# Run script uses standard ways to run the application
CMD nginx -g "daemon off;"

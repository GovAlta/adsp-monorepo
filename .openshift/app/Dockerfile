FROM registry.access.redhat.com/ubi9/nginx-120:latest

ARG SERVICE

# Add application sources
COPY dist/apps/${SERVICE}/nginx.conf "${NGINX_CONF_PATH}"
COPY --exclude=**/nginx.conf dist/apps/${SERVICE} .

# Run script uses standard ways to run the application
CMD nginx -g "daemon off;"

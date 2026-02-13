FROM registry.access.redhat.com/ubi9/nginx-120:latest

ARG SERVICE

# Add application sources
ADD dist/apps/${SERVICE}/nginx.conf "${NGINX_CONF_PATH}"
ADD dist/apps/${SERVICE} .

# Run script uses standard ways to run the application
CMD nginx -g "daemon off;"

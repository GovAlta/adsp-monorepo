FROM mkodockx/docker-clamav:alpine

USER 0

COPY clamd.conf /etc/clamav/

# Update permissions so the arbitrary UID running the container process can access paths
RUN mkdir /store && \
    chgrp -R 0 /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav && \
    chmod -R g=u /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav

USER 1001:0

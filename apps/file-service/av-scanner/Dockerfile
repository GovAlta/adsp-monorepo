FROM mk0x/docker-clamav:alpine

# Update permissions so the arbitrary UID running the container process can access paths
RUN mkdir /run/clamav /store/tmp && \ 
    touch /run/clamd.pid && \
    chgrp -R 0 /store/tmp /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav /run/clamd.pid && \
    chmod -R g=u /store/tmp /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav /run/clamd.pid

USER 1001:0

FROM mkodockx/docker-clamav:alpine
#USER 101

COPY clamd.conf /etc/clamav/
#ADD clamd.conf /etc/clamav/clamd.conf
USER 0
RUN mkdir /store && chown -R clamav:clamav /store
# RUN chgrp -R 0 /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav && \
#     chmod -R g=u /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav
USER clamav
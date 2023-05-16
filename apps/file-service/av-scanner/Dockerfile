FROM mkodockx/docker-clamav:alpine

USER 0

RUN mkdir /store
RUN chmod 777 bootstrap.sh
RUN chmod -R 777 /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav /sbin/nologin

# Set arbitrary user for testing purpose
USER 10000:10000
COPY clamd.conf /etc/clamav/

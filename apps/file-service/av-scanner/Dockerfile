FROM mkodockx/docker-clamav:alpine

ARG UID=1000690000
ARG GID=1000690000
USER 0
RUN apk add shadow

RUN /usr/sbin/groupadd -g ${GID} runner && \
    /usr/sbin/useradd -u ${UID} -g ${GID} -s /bin/sh runner

RUN mkdir /store && chown -R runner:runner /store
RUN chown -R runner:runner /store /var/log/clamav /var/lib/clamav /run/clamav /var/run/clamav /sbin/nologin /bootstrap.sh

USER runner:runner

COPY clamd.conf /etc/clamav/

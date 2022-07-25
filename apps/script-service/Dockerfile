# This is a minimal Dockerfile for app deployment.
FROM registry.access.redhat.com/ubi8/dotnet-60-runtime

USER 0

RUN yum makecache \
  && yum -y install curl make gcc \
  && yum -y clean all  \
  && rm -rf /var/cache

RUN curl -R -O http://www.lua.org/ftp/lua-5.4.4.tar.gz \
  && tar zxf lua-5.4.4.tar.gz \
  && make --directory lua-5.4.4 all install

USER 1001:0

ARG SERVICE

COPY ./dist/apps/${SERVICE} .

CMD dotnet Adsp.Platform.ScriptService.dll

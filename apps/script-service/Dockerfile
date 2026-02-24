FROM registry.access.redhat.com/ubi9/ubi AS builder

WORKDIR /opt/app-root/src
USER 0

RUN dnf makecache \
  && dnf -y install cmake make gcc \
  && dnf -y clean all  \
  && rm -rf /var/cache

RUN curl -LJO https://github.com/NLua/lua/tarball/75f9788 \
  && tar zxf NLua-lua-5.2-128-g75f9788.tar.gz \
  && mkdir _build && cd _build \
  && cmake ../NLua-lua-75f9788 && cmake --build . --config Release

USER 1001:0

FROM registry.access.redhat.com/ubi9/dotnet-100-runtime

ARG SERVICE

COPY ./dist/apps/${SERVICE} .
COPY --from=builder /opt/app-root/src/_build/lib64/liblua54.so ./runtimes/linux-x64/native/liblua54.so

CMD dotnet Adsp.Platform.ScriptService.dll

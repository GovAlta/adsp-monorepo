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

FROM registry.access.redhat.com/ubi9-minimal:9.7 AS runtime

ENV \
    DOTNET_RUNNING_IN_CONTAINER=true \
    ASPNETCORE_URLS=http://*:8080 \
    APP_UID=1001

# Install ASP.NET Core runtime (includes Microsoft.AspNetCore.App framework)
# tar, gzip: enable installing vsdbg into the image for debugging
RUN INSTALL_PKGS="aspnetcore-runtime-10.0 tar gzip" && \
    microdnf install -y --setopt=tsflags=nodocs --setopt=install_weak_deps=0 $INSTALL_PKGS && \
    ( microdnf reinstall tzdata -y || microdnf update tzdata -y ) && \
    microdnf clean all -y && \
    rm -rf /var/cache/yum/*

# Add default user
RUN useradd -u $APP_UID -r -g 0 -d /opt/app-root -s /sbin/nologin -c "Default Application User" default && \
    install -d -m 0775 -o $APP_UID -g 0 /opt/app-root

USER $APP_UID
ENV HOME=/opt/app-root
WORKDIR /opt/app-root

ARG SERVICE

COPY ./dist/apps/${SERVICE} .
COPY --from=builder /opt/app-root/src/_build/lib64/liblua54.so ./runtimes/linux-x64/native/liblua54.so

EXPOSE 8080

CMD ["dotnet", "Adsp.Platform.ScriptService.dll"]

# This is a minimal Dockerfile for app deployment.
FROM registry.access.redhat.com/ubi8/dotnet-60-runtime

ARG SERVICE

COPY ./dist/apps/${SERVICE} .

CMD dotnet Adsp.Platform.ScriptService.dll

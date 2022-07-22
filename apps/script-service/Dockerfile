# This is a minimal Dockerfile for app deployment.
FROM registry.access.redhat.com/ubi8/dotnet-60-runtime

ARG PROJECT

COPY ./dist/apps/${PROJECT} .

CMD dotnet Adsp.Platform.ScriptService.dll

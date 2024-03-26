FROM registry.access.redhat.com/ubi8/python-311

ARG SERVICE

USER 0

COPY ./dist/apps/${SERVICE}/*.whl .
RUN chown -R 1001:0 ./

USER 1001:0

# Install the dependencies
RUN pip install --upgrade pip && \
  pip install *.whl && \
  pip install gunicorn

# Run the application
CMD gunicorn -b :3333 --timeout 600 --access-logfile - 'pii_service:app'

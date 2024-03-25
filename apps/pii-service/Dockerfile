FROM registry.access.redhat.com/ubi8/python-311

ARG SERVICE

USER 0

COPY ./dist/apps/${SERVICE}/*.whl .
RUN chown -R 1001:0 ./

USER 1001:0

# Install the dependencies
RUN pip install -U \
  pip install *.whl && \
  pip install gunicorn

# Run the application
CMD gunicorn -w 4 -b 0.0.0.0:3333 'pii_service:app'

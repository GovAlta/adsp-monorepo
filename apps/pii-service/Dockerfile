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
RUN python -m spacy download en_core_web_lg

# Run the application
CMD gunicorn -w 2 -b :3333 --timeout 600 --access-logfile - --error-logfile - 'pii_service:app'

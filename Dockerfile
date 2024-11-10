FROM python:3.12
RUN pip install pymongo fastapi[all] texttable cryptography
COPY python /app
COPY goods.json /
WORKDIR /app
CMD ["python3", "mainserver.py"]
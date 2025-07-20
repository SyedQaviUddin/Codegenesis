FROM python:3.10-slim
WORKDIR /app
COPY backend/ ./backend/
COPY .kiro/specs.yaml ./.kiro/specs.yaml
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"] 
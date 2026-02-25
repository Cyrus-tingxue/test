FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

RUN mkdir -p /app/data

# 默认配置（API Key 请通过 docker-compose 环境变量或 .env 传入，勿硬编码）
ENV DEFAULT_PROVIDER=OpenRouter
ENV DEFAULT_MODEL=arcee-ai/trinity-large-preview:free
ENV DEFAULT_API_KEY=""

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "80"]

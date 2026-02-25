FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

RUN mkdir -p /app/data

# 创建非 root 用户运行应用
RUN adduser --disabled-password --gecos "" --no-create-home appuser \
    && chown -R appuser:appuser /app
USER appuser

# 默认配置（API Key 请通过 docker-compose 环境变量或 .env 传入）
ENV DEFAULT_PROVIDER=OpenRouter
ENV DEFAULT_MODEL=arcee-ai/trinity-large-preview:free
ENV DEFAULT_API_KEY="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"

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "80"]

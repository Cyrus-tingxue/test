FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

RUN mkdir -p /app/data

# 默认配置（API Key 请通过 docker run -e DEFAULT_API_KEY=xxx 传入，勿写在镜像中）
ENV DEFAULT_PROVIDER=OpenRouter
ENV DEFAULT_MODEL=arcee-ai/trinity-large-preview:free
ENV DEFAULT_API_KEY=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

EXPOSE 8000

CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]

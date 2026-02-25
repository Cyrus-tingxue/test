import os
import json
import time
import asyncio
from typing import Callable, Any
from utils.llm_client import acall_llm_stream

# ── Default config from environment variables ──
DEFAULT_PROVIDER = os.environ.get("DEFAULT_PROVIDER", "OpenRouter")
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "arcee-ai/trinity-large-preview:free")
DEFAULT_API_KEY = os.environ.get("DEFAULT_API_KEY", "")

def resolve_api_key(key: str) -> str:
    """当前端未提供 API Key 时，回退到默认值并清理外层引号防止格式错误。"""
    val = key.strip() if key and key.strip() else DEFAULT_API_KEY
    return val.strip('"').strip("'")
def resolve_model(model: str) -> str:
    """当前端未提供模型名时，回退到默认模型。"""
    return model.strip() if model and model.strip() else DEFAULT_MODEL

# 临时文件下载缓存: {file_id: {"path": str, "filename": str, "media_type": str, "ts": float}}
TEMP_DOWNLOADS = {}

async def keepalive_llm_stream(provider: str, model: str, api_key: str, messages: list[dict], process_fn: Callable[[str], Any] = None, **extra):
    """空格保活的流式 LLM 调用生成器。
    在 LLM 处理期间每 3 秒发送一个空格字符保持 TCP 连接活跃。
    LLM 完成后，调用 process_fn 处理完整文本，最终发送 JSON 结果。
    """
    collected = []
    done = asyncio.Event()
    error_holder = {}

    async def llm_task():
        try:
            async for chunk in acall_llm_stream(
                provider=provider,
                model=model,
                api_key=api_key,
                messages=messages,
                **extra
            ):
                collected.append(chunk)
        except Exception as e:
            error_holder['error'] = e
        finally:
            done.set()

    task = asyncio.create_task(llm_task())

    while not done.is_set():
        yield " "
        try:
            await asyncio.wait_for(asyncio.shield(done.wait()), timeout=3.0)
        except asyncio.TimeoutError:
            pass

    if 'error' in error_holder:
        yield json.dumps({"detail": str(error_holder['error'])})
    else:
        full_text = "".join(collected)
        if process_fn:
            try:
                result = process_fn(full_text)
                yield json.dumps(result, ensure_ascii=False)
            except Exception as e:
                yield json.dumps({"detail": f"处理结果时出错: {str(e)}"})
        else:
            yield json.dumps({"text": full_text}, ensure_ascii=False)

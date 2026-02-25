"""Office AI Mate — LLM 客户端封装

基于 LiteLLM 实现统一的多模型调用接口。
支持原生提供者（OpenAI/Anthropic/Google）以及
OpenAI 兼容平台（SiliconCloud/OpenRouter）。
"""

from __future__ import annotations

from typing import Generator, Any, AsyncGenerator

import litellm
from config import PROVIDER_BASE_URL, PROVIDER_MODEL_PREFIX




def _resolve_model(provider: str, model: str, api_base: str | None) -> str:
    """根据 provider 和 api_base 为模型名加上 LiteLLM 所需的前缀。

    - 有自定义 api_base → 走 OpenAI 兼容协议，需要 "openai/" 前缀
    - Google 原生 → 需要 "gemini/" 前缀
    - 已经有正确前缀的不重复添加
    """
    if api_base:
        # 自定义 base URL → OpenAI 兼容，确保有 openai/ 前缀
        if not model.startswith("openai/"):
            return f"openai/{model}"
        return model

    # 原生 provider 可能需要特定前缀
    prefix = PROVIDER_MODEL_PREFIX.get(provider, "")
    if prefix and not model.startswith(prefix):
        return f"{prefix}{model}"
    return model


def _build_kwargs(provider: str, model: str, api_key: str, messages: list[dict[str, Any]], **extra) -> dict:
    """构造 LiteLLM completion() 的关键字参数。"""
    # 确定 api_base
    api_base = extra.pop("api_base", None) or PROVIDER_BASE_URL.get(provider)

    # 解析最终模型名
    resolved_model = _resolve_model(provider, model, api_base)

    kwargs: dict = {"model": resolved_model, "messages": messages, "api_key": api_key, **extra}
    if api_base:
        kwargs["api_base"] = api_base
    return kwargs


def call_llm(
    provider: str,
    model: str,
    api_key: str,
    messages: list[dict[str, Any]],
    **extra,
) -> str:
    """同步调用 LLM 并返回完整回复文本。"""
    kwargs = _build_kwargs(provider, model, api_key, messages, **extra)
    response = litellm.completion(**kwargs)
    return response.choices[0].message.content


def call_llm_stream(
    provider: str,
    model: str,
    api_key: str,
    messages: list[dict[str, Any]],
    **extra,
) -> Generator[str, None, None]:
    """流式调用 LLM，逐块产出文本（用于聊天界面实时显示）。"""
    kwargs = _build_kwargs(provider, model, api_key, messages, stream=True, **extra)
    response = litellm.completion(**kwargs)
    for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content

async def acall_llm(
    provider: str,
    model: str,
    api_key: str,
    messages: list[dict[str, Any]],
    **extra,
) -> str:
    """异步调用 LLM 并返回完整回复文本。"""
    kwargs = _build_kwargs(provider, model, api_key, messages, **extra)
    response = await litellm.acompletion(**kwargs)
    return response.choices[0].message.content

async def acall_llm_stream(
    provider: str,
    model: str,
    api_key: str,
    messages: list[dict[str, Any]],
    **extra,
) -> AsyncGenerator[str, None]:
    """流式异步调用 LLM，逐块产出文本。"""
    kwargs = _build_kwargs(provider, model, api_key, messages, stream=True, **extra)
    response = await litellm.acompletion(**kwargs)
    async for chunk in response:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content




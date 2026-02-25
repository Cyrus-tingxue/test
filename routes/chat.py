import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from schemas import ChatRequest
from core_helpers import resolve_api_key, resolve_model
from utils.llm_client import acall_llm_stream

logger = logging.getLogger("office-ai-mate.chat")
router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        api_key = resolve_api_key(request.api_key)
        if not api_key:
             raise HTTPException(status_code=400, detail="API Key is required")

        extra = {}
        if request.base_url:
            extra["api_base"] = request.base_url
            
        async def event_generator():
            try:
                async for chunk in acall_llm_stream(
                    provider=request.provider,
                    model=resolve_model(request.model),
                    api_key=api_key,
                    messages=request.messages,
                    **extra
                ):
                    yield chunk
            except Exception as e:
                yield f"Error: {str(e)}"

        return StreamingResponse(event_generator(), media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

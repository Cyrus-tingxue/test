import os
import io
import traceback
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from core_helpers import resolve_api_key
from utils.file_parser import parse_file
from utils.chat_analyzer import analyze_chat_style
from utils.local_scanner import scan_qq_logs

router = APIRouter()

@router.post("/analyze")
async def persona_analyze(
    file: UploadFile = File(...),
    provider: str = Form("OpenRouter"),
    model: str = Form("gpt-3.5-turbo"),
    api_key: str = Form(""),
    base_url: str = Form(None)
):
    try:
        api_key = resolve_api_key(api_key)
        file_bytes = await file.read()
        
        class NamedBytesIO(io.BytesIO):
            def __init__(self, content, name):
                super().__init__(content)
                self.name = name
        
        f_obj = NamedBytesIO(file_bytes, file.filename)
        file_content = parse_file(f_obj)
        
        if file_content.startswith("["):
             return JSONResponse(status_code=400, content={"detail": file_content})

        system_prompt = await analyze_chat_style(
            text_content=file_content,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url
        )
        return {"system_prompt": system_prompt}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/local_scan")
async def persona_local_scan():
    try:
        files = scan_qq_logs()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze_text")
async def persona_analyze_text(
    text: str = Form(...),
    provider: str = Form("OpenRouter"),
    model: str = Form("gpt-3.5-turbo"),
    api_key: str = Form(""),
    base_url: str = Form(None)
):
    try:
        api_key = resolve_api_key(api_key)
        system_prompt = await analyze_chat_style(
            text_content=text,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url
        )
        return {"system_prompt": system_prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import_local")
async def persona_import_local(
    path: str = Form(...),
    provider: str = Form("OpenRouter"),
    model: str = Form("gpt-3.5-turbo"),
    api_key: str = Form(""),
    base_url: str = Form(None)
):
    try:
        api_key = resolve_api_key(api_key)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found")
            
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            file_content = f.read()
            
        system_prompt = await analyze_chat_style(
            text_content=file_content,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url
        )
        return {"system_prompt": system_prompt}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

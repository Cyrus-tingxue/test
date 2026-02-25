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
    model: str = Form(""),
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
    model: str = Form(""),
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
    model: str = Form(""),
    api_key: str = Form(""),
    base_url: str = Form(None)
):
    try:
        api_key = resolve_api_key(api_key)

        # 安全校验：解析真实路径，防止路径遍历攻击
        # 可通过环境变量 ALLOWED_IMPORT_DIRS 配置允许路径（逗号分隔），默认仅允许数据目录
        default_dirs = os.path.join(os.getcwd(), "data")
        allowed_str = os.environ.get("ALLOWED_IMPORT_DIRS", default_dirs)
        ALLOWED_BASE_DIRS = [d.strip() for d in allowed_str.split(",") if d.strip()]
        real_path = os.path.realpath(path)
        if not any(real_path.startswith(os.path.realpath(d)) for d in ALLOWED_BASE_DIRS):
            raise HTTPException(status_code=403, detail="访问路径不在允许范围内")

        if not os.path.exists(real_path):
            raise HTTPException(status_code=404, detail="File not found")
        if not os.path.isfile(real_path):
            raise HTTPException(status_code=400, detail="路径必须是文件")

        with open(real_path, 'r', encoding='utf-8', errors='ignore') as f:
            file_content = f.read()
            
        system_prompt = await analyze_chat_style(
            text_content=file_content,
            provider=provider,
            model=model,
            api_key=api_key,
            base_url=base_url
        )
        return {"system_prompt": system_prompt}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


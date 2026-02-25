import os
import re
import io
import traceback
import platform
from contextlib import redirect_stdout
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from security import get_current_user

from schemas import SystemRequest, SystemExecuteRequest
from core_helpers import resolve_api_key, resolve_model, keepalive_llm_stream

router = APIRouter()

@router.post("/generate_code")
async def system_generate_code(request: SystemRequest, user: dict = Depends(get_current_user)):
    try:
        _SYSTEM_PROMPT = """
        你是一个精通 Python 系统操作的 AI 助手。
        用户的需求是：{query}
        
        请生成一段 Python 代码来实现该需求。
        要求：
        1. 仅使用 Python 标准库（如 os, shutil, glob, pathlib, datetime 等），严禁使用第三方库。
        2. 代码必须是完整的、可执行的脚本。
        3. 代码中不要包含 input() 等交互函数。
        4. 将代码包裹在 ```python ... ``` 代码块中。
        5. 不要解释代码，只返回代码块。
        
        当前工作目录：{cwd}
        操作系统：{os_name}
        """
        prompt = _SYSTEM_PROMPT.format(
            query=request.query,
            cwd=os.getcwd(),
            os_name=platform.system()
        )
        
        messages = [{"role": "user", "content": prompt}]
        extra = {}
        if request.base_url: extra["api_base"] = request.base_url

        def process_code(response_text):
            code = re.sub(r"```python(.*?)```", r"\1", response_text, flags=re.DOTALL)
            code = re.sub(r"```", "", code).strip()
            return {"code": code}

        return StreamingResponse(
            keepalive_llm_stream(
                provider=request.provider,
                model=resolve_model(request.model),
                api_key=resolve_api_key(request.api_key),
                messages=messages,
                process_fn=process_code,
                **extra
            ),
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute_code")
async def system_execute_code(request: SystemExecuteRequest, user: dict = Depends(get_current_user)):
    try:
        # SECURITY: Needs authentication and sandboxing in production
        code = request.code
        buffer = io.StringIO()
        
        try:
             with redirect_stdout(buffer):
                exec(code, {"__name__": "__main__"})
             output = buffer.getvalue()
        except Exception:
             output = buffer.getvalue() + "\n" + traceback.format_exc()
             
        return {"output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

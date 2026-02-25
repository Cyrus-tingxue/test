import os
import io
import time
import uuid
import tempfile
import sys
import subprocess
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse

from schemas import CodeRequest
from core_helpers import resolve_api_key, resolve_model, keepalive_llm_stream, TEMP_DOWNLOADS
from utils.llm_client import acall_llm_stream

router = APIRouter()

@router.post("/generate")
async def generate_code(request: CodeRequest):
    try:
        role_map = {
            "generate": "你是一个资深程序员。请根据需求生成高质量、可运行的代码。",
            "review": "你是一个代码审查专家。请Review以下代码，指出潜在Bug、性能问题和改进建议。",
            "debug": "你是一个Debug专家。请分析以下代码的错误，并给出修复后的代码。",
            "explain": "你是一个计算机科学教师。请通俗易懂地解释以下代码的逻辑和功能。"
        }
        system_role = role_map.get(request.task, "你是一个全能编程助手。")
        user_content = f"语言：{request.language}\n\n内容/需求：\n{request.content}"
        messages = [{"role": "system", "content": system_role}, {"role": "user", "content": user_content}]
        extra = {}
        if request.base_url: extra["api_base"] = request.base_url

        async def event_generator():
            try:
                async for chunk in acall_llm_stream(provider=request.provider, model=resolve_model(request.model), api_key=resolve_api_key(request.api_key), messages=messages, **extra):
                    yield chunk
            except Exception as e:
                yield f"Error: {str(e)}"

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/excel/process")
async def process_excel(
    file: UploadFile = File(...),
    instruction: str = Form(...),
    provider: str = Form("OpenRouter"),
    model: str = Form("gpt-3.5-turbo"),
    api_key: str = Form(""),
    base_url: str = Form(None)
):
    try:
        import pandas as pd
        api_key = resolve_api_key(api_key)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx", mode="wb") as input_tmp:
            input_path = input_tmp.name
            content = await file.read()
            input_tmp.write(content)

        try:
            xl = pd.ExcelFile(input_path)
            sheet_names = xl.sheet_names
            schema_info = []
            for sheet in sheet_names[:3]:
                df_preview = pd.read_excel(input_path, sheet_name=sheet, nrows=5)
                columns = df_preview.columns.tolist()
                schema_info.append(f"Sheet '{sheet}': Columns {columns}")
            schema_str = "\n".join(schema_info)
        except Exception as e:
            return JSONResponse(status_code=400, content={"detail": f"无法读取 Excel 文件: {str(e)}"})

        output_path = input_path.replace(".xlsx", "_processed.xlsx")
        system_prompt = (
            "你是一个 Python 数据分析专家。你的任务是编写 Python 代码来处理 Excel 文件。\n"
            "【规则】1. 使用 pandas 和 openpyxl 库。2. 代码必须是完整的、可执行的脚本。3. 输入文件路径为变量 `INPUT_PATH`，输出文件路径为变量 `OUTPUT_PATH`。4. 不要使用 input()，不要有交互式命令。5. 只输出代码，不要包含任何 Markdown 标记。6. 必须处理并保存文件到 `OUTPUT_PATH`。"
        )
        user_prompt = f"输入文件: {input_path}\n输出文件: {output_path}\n文件结构:\n{schema_str}\n\n用户需求: {instruction}\n\n请编写 Python 代码实现上述需求。代码中直接使用给定的路径变量。"
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
        extra = {}
        if base_url: extra["api_base"] = base_url

        def process_code_and_run(generated_code):
            code = generated_code.strip()
            if "```python" in code: code = code.split("```python")[1].split("```")[0]
            elif "```" in code: code = code.split("```")[1].split("```")[0]
            path_injection = (
                "import warnings\n"
                "warnings.filterwarnings('ignore')\n"
                f"INPUT_PATH = r'{input_path}'\n"
                f"OUTPUT_PATH = r'{output_path}'\n"
            )
            final_code = path_injection + code

            with tempfile.NamedTemporaryFile(delete=False, suffix=".py", mode="w", encoding="utf-8") as code_tmp:
                code_tmp.write(final_code)
                code_path = code_tmp.name
                
            try:
                result = subprocess.run([sys.executable, code_path], capture_output=True, text=True, timeout=60)
                if result.returncode != 0:
                    raise Exception(f"代码执行失败:\n{result.stderr}\n\n生成的代码:\n{final_code}")
            except subprocess.TimeoutExpired:
                raise Exception("处理超时 (60s)")
            
            if os.path.exists(output_path):
                file_id = str(uuid.uuid4())
                filename = f"processed_{int(time.time())}.xlsx"
                TEMP_DOWNLOADS[file_id] = {
                    "path": output_path, "filename": filename,
                    "media_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "ts": time.time()
                }
                return {"download_url": f"/api/download/{file_id}"}
            else:
                raise Exception("输出文件未生成。可能是代码逻辑错误。")

        return StreamingResponse(keepalive_llm_stream(provider=provider, model=model, api_key=api_key, messages=messages, process_fn=process_code_and_run, **extra), media_type="application/json")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

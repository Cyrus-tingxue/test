import os
import time
import logging
from dotenv import load_dotenv
load_dotenv()  # 加载 .env 文件到环境变量
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

# --- 导入拆分的路由模块 ---
from routes import search, chat, generate, convert, persona, system, game, code, auth
from core_helpers import DEFAULT_PROVIDER, DEFAULT_MODEL, DEFAULT_API_KEY, TEMP_DOWNLOADS
from database import init_db

# 初始化日志配置
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("office-ai-mate.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # App Startup
    init_db()
    yield
    # App Shutdown
    pass

app = FastAPI(title="Office AI Mate Backend", lifespan=lifespan)

# 处理跨域（生产环境请根据实际域名收紧）
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:8000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (保留原有的异常处理和健康检查代码等) ...
# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception on {request.url.path}: {exc}")
    # 避免返回完整的回溯信息，提高安全性
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"}
    )

# --- 根级/基础 API 端点 ---
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Office AI Mate API is running"}

@app.get("/api/download/{file_id}")
async def download_temp_file(file_id: str):
    """下载由保活端点生成的临时文件。"""
    # 清理过期文件 (超过 10 分钟)
    expired = [k for k, v in TEMP_DOWNLOADS.items() if time.time() - v['ts'] > 600]
    for k in expired:
        path = TEMP_DOWNLOADS.pop(k, {}).get('path', '')
        if path and os.path.exists(path):
            try: os.remove(path)
            except: pass

    info = TEMP_DOWNLOADS.pop(file_id, None)
    if not info or not os.path.exists(info['path']):
        raise HTTPException(status_code=404, detail="File not found or expired")
    return FileResponse(info['path'], media_type=info['media_type'], filename=info['filename'])

@app.get("/api/defaults")
async def get_defaults():
    """返回默认配置（不暴露 API Key）。"""
    return {
        "provider": DEFAULT_PROVIDER,
        "model": DEFAULT_MODEL,
        "has_default_key": bool(DEFAULT_API_KEY)
    }

# --- 挂载子路由 ---
app.include_router(auth.router, prefix="/api/auth")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(generate.router, prefix="/api/generate")
app.include_router(code.router, prefix="/api/code")
app.include_router(convert.router, prefix="/api/convert")
app.include_router(persona.router, prefix="/api/persona")
app.include_router(system.router, prefix="/api/system")
app.include_router(game.router, prefix="/api/game")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)


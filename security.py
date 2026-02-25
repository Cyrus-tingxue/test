import os
import time
import logging
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("office-ai-mate.security")

# JWT 配置项
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
if not SECRET_KEY:
    SECRET_KEY = "office-ai-mate-secret-development-key-fallback"
    logger.warning("⚠️  JWT_SECRET_KEY 未设置，使用不安全的默认值！生产环境请务必配置！")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Token 默认过期时间为 7 天

security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证用户提交明文密码与库中哈希是否匹配"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """对用户密码进行安全的哈希加密处理"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """基于载荷（用户资料）签发 JWT 令牌"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    # 包含了 username 和 exp 两类 claims
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """FastAPI 依赖项：从请求头 Authorization 读取并解析 Bearer JWT"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="无效的认证凭据 (未找到用户标识)")
        return {"username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="登录状态已过期，请重新登录")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="无效的认证凭证 (Token 验证失败)")

import logging
from fastapi import APIRouter, HTTPException, Depends
from schemas import UserRegister, UserLogin, Token
from database import get_db_connection
from security import verify_password, get_password_hash, create_access_token

logger = logging.getLogger("office-ai-mate.auth")
router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user: UserRegister):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="用户名已被注册")
            
        # 2. Hash password and insert
        hashed_password = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)", 
            (user.username, hashed_password)
        )
        conn.commit()
        
        # 3. Create initial token to login immediately
        access_token = create_access_token(data={"sub": user.username})
        logger.info(f"新用户注册成功: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"注册过程出错: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="服务器内部错误")
    finally:
        conn.close()

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (user.username,))
        row = cursor.fetchone()
        
        # Valid user & pwd
        if not row or not verify_password(user.password, row['password_hash']):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
            
        access_token = create_access_token(data={"sub": user.username})
        logger.info(f"用户登录成功: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
         logger.error(f"登录过程出错: {e}")
         raise HTTPException(status_code=500, detail="服务器内部错误")
    finally:
        conn.close()

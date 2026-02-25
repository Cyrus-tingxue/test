import sqlite3
import os
import logging

logger = logging.getLogger("office-ai-mate.database")

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "app.db")

def get_db_connection():
    """获取一个 SQLite 数据库连接。"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # 让返回结果可以通过列名访问
    return conn

def init_db():
    """初始化数据库表结构，在服务启动时调用。"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 创建 users 表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        logger.info("数据库及 'users' 表初始化完成。")
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

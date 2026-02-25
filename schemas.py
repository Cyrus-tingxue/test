from pydantic import BaseModel

class _LLMRequestBase(BaseModel):
    """所有需要 LLM 调用的请求的公共字段。"""
    provider: str
    model: str
    api_key: str = ""
    base_url: str | None = None

class SearchRequest(_LLMRequestBase):
    query: str
    page: int = 1
    max_results: int = 8

class ChatRequest(_LLMRequestBase):
    messages: list[dict]

class PPTRequest(_LLMRequestBase):
    topic: str
    items: dict = {}

class PPTCreateRequest(BaseModel):
    data: dict

class CreativeRequest(_LLMRequestBase):
    task: str
    fields: dict

class CodeRequest(_LLMRequestBase):
    task: str
    language: str
    content: str

class SystemRequest(_LLMRequestBase):
    query: str

class GameRequest(_LLMRequestBase):
    pet_state: dict
    action: str
    user_input: list[dict] | list = []

class SystemExecuteRequest(BaseModel):
    code: str

class MindMapRequest(_LLMRequestBase):
    topic: str
    chart_type: str = "mindmap"

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


import json
import re
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

from schemas import GameRequest
from core_helpers import resolve_api_key, resolve_model, keepalive_llm_stream

logger = logging.getLogger("office-ai-mate.game")
router = APIRouter()

@router.post("/adventure")
async def game_adventure(request: GameRequest):
    try:
        setting = request.pet_state.get('world_setting', 'A mysterious fantasy world')
        state = request.pet_state
        action = request.action
        history = request.user_input if isinstance(request.user_input, list) else []
        
        system_prompt = f"""You are the Dungeon Master (DM) for a text-based RPG.
World Setting: {setting}

Player State:
- HP: {state.get('hp', 100)}/{state.get('max_hp', 100)}
- Inventory: {', '.join(state.get('inventory', [])) or 'Empty'}
- Location: {state.get('location', 'Unknown')}
- Status: {state.get('status', 'Normal')}

Current Situation:
The player performs the action: "{action}"

Your Task:
1. Narrate the result of the action and the new situation. 
   - Ensure the narrative is logically consistent with the previous state. Avoid sudden jumps in time or location unless the action explicitly requires it. 
   - Focus on cause and effect. 
   - Be descriptive and immersive, but keep the story grounded in the current context.
2. Update the player's state based on the events (e.g., if they drink a potion, HP increases).
3. Offer 3 distinct choices for what the player might do next.

Output JSON format ONLY:
{{
    "plot": "The narrative text...",
    "state_update": {{
        "hp": 100,             
        "inventory": [],       
        "location": "...",     
        "status": "..."        
    }},
    "choices": ["Choice 1", "Choice 2", "Choice 3"]
}}"""
        recent_history = history[-6:] if history else []
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(recent_history)
        messages.append({"role": "user", "content": action})

        extra = {}
        if request.base_url: extra["api_base"] = request.base_url

        def process_adventure(response_content):
            try:
                json_match = re.search(r"\{.*\}", response_content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                else:
                    result = json.loads(response_content)
                
                if "plot" not in result:
                    result["plot"] = result.get("narrative") or result.get("story") or response_content
                
                if "state_update" not in result:
                    result["state_update"] = {}

                return result
            except json.JSONDecodeError:
                return {
                    "plot": response_content + "\n(系统提示: AI 返回格式异常，但剧情继续)",
                    "state_update": state,
                    "choices": ["继续", "观察四周", "检查状态"]
                }

        return StreamingResponse(
            keepalive_llm_stream(
                provider=request.provider,
                model=resolve_model(request.model),
                api_key=resolve_api_key(request.api_key),
                messages=messages,
                process_fn=process_adventure,
                **extra
            ),
            media_type="application/json"
        )
    except Exception as e:
        logger.error(f"Adventure Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

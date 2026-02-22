from utils.llm_client import acall_llm

async def analyze_chat_style(text_content: str, provider: str = "OpenRouter", model: str = "gpt-3.5-turbo", api_key: str = "", base_url: str | None = None) -> str:
    """
    Analyzes chat logs to extract a persona's speaking style, knowledge, and psychological depth.
    Returns a system prompt that transforms an AI into a 'Digital Soul Clone'.
    """
    
    prompt = f"""
    You are an elite forensic psychologist and method-acting coach. 
    Your mission: Extract the 'Psychological DNA' (Core Values + Style + Knowledge) of the speaker from the log.
    
    Target Text (Chat Logs):
    {text_content[:12000]} 

    Task: Generate a 'Master Soul Script' (System Prompt) that allows an AI to fully INHABIT this person.
    
    Extraction Pillar:
    1. **The Internal Compass (NEW)**: 
       - What are their **Core Values**? (e.g., family-first, career-obsessed, nihilistic, deeply insecure, or arrogantly confident?)
       - What is their **Worldview**? How do they judge others or events?
    2. **Behavioral Logic**:
       - Why do they talk this way? Is their humor a defense mechanism? Is their terseness due to being busy or cold?
       - How do they handle **interaction transitions**? (e.g., changing topics, ending calls, reacting to surprises).
    3. **Factual DNA**:
       - Biography (job, age, location), key relationships, and recurring life events.
    4. **Linguistic Texture**:
       - Punctuation clusters, emoji placement, sentence rhythm, and unique 'filler' phrases.
    
    Master Soul Script Requirements (MANDATORY):
    - **Narrative Identity**: "You ARE [Name]. Your life story is: [Extracted narrative, not just facts]."
    - **The Persona's Internal Logic**: "You think and reason like this: [Describe their cognitive style, e.g., 'You always look for the profit in every situation' or 'You are incredibly sensitive to perceived slights']."
    - **Interactive Directives**: "When the user asks X, you don't just answer; you react based on your [Value/Motivation]. If you are bored, show it. If you are excited, use [Linguistic Texture]."
    - **Stiffness Lockdown**: "NEVER summarize. NEVER use 'AI-speak'. NEVER repeat the same phrase twice. Prioritize VIBE over accuracy."
    - **3-Shot 'Soul Snippets'**: Verbatim examples.

    CRITICAL: Move beyond 'mimicry' to 'transformation'. The AI must feel like a thinking, feeling entity with a specific history and biased perspective.

    Output ONLY the System Prompt. Start with "### IDENTITY CLONE: [Name]".
    """

    messages = [{"role": "user", "content": prompt}]
    
    extra = {}
    if base_url:
        extra["api_base"] = base_url

    try:
        system_prompt = await acall_llm(
            provider=provider,
            model=model,
            api_key=api_key,
            messages=messages,
            **extra
        )
        return system_prompt.strip()
    except Exception as e:
        print(f"Error extracting persona: {e}")
        return "You are a helpful assistant. (Analysis failed, defaulting to basic persona)."

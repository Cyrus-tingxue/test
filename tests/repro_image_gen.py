
import sys
import os
import io
from unittest.mock import MagicMock, patch

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Mock litellm before importing utils.llm_client
sys.modules["litellm"] = MagicMock()
import litellm

# Add project root to path
sys.path.append(os.getcwd())

from utils.llm_client import call_image_generation

def test_image_generation_logic():
    with open("tests/output_direct.txt", "w", encoding="utf-8") as f:
        def my_print(s):
            f.write(s + "\n")
            print(s)

        my_print("Testing call_image_generation logic...")

        # Mock litellm.image_generation to return a dummy response
        mock_response = MagicMock()
        mock_response.data = [{"url": "http://fake-url.com/image.png"}]
        litellm.image_generation.return_value = mock_response

        # Test Case 1: Standard OpenAI
        my_print("\n--- Test Case 1: Standard OpenAI ---")
        call_image_generation(
            provider="OpenAI",
            model="dall-e-3",
            api_key="sk-test",
            prompt="A cute cat"
        )
        # Check arguments passed to litellm
        args, kwargs = litellm.image_generation.call_args
        my_print(f"Called with kwargs: {kwargs}")
        
        # Test Case 2: Custom Provider with Base URL (User Scenario likely)
        my_print("\n--- Test Case 2: Custom Provider (SiliconCloud/Other) ---")
        call_image_generation(
            provider="OpenAI", # api_server hardcodes this to OpenAI
            model="stabilityai/stable-diffusion-3-medium",
            api_key="sk-test",
            prompt="A cute cat",
            api_base="https://api.siliconflow.cn/v1"
        )
        args, kwargs = litellm.image_generation.call_args
        my_print(f"Called with kwargs: {kwargs}")

        # Test Case 3: Google (Native)
        my_print("\n--- Test Case 3: Google ---")
        try:
            call_image_generation(
                provider="Google",
                model="imagen-3",
                api_key="key",
                prompt="cat"
            )
            args, kwargs = litellm.image_generation.call_args
            my_print(f"Called with kwargs: {kwargs}")
        except Exception as e:
            my_print(f"Error: {e}")

if __name__ == "__main__":
    test_image_generation_logic()

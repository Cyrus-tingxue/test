
import sys
import os
from unittest.mock import patch, MagicMock

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import pandas
    import openpyxl
    print("SUCCESS: pandas and openpyxl are installed")
except ImportError as e:
    print(f"ERROR: {e}")
    sys.exit(1)

from fastapi.testclient import TestClient
from api_server import app

def test_excel_generation():
    # Raise exceptions from the app so we can see them
    client = TestClient(app, raise_server_exceptions=True)
    
    # Mock the LLM call to return CSV content
    mock_csv_content = "Month,Product,Revenue\nJan,A,100\nFeb,B,200\nMar,C,300"
    
    # Patch where it is looked up: api_server.call_llm
    with patch('api_server.call_llm', return_value=mock_csv_content) as mock_llm:
        try:
            response = client.post(
                "/api/generate/creative",
                json={
                    "task": "excel_gen",
                    "fields": {"content": "Test data"},
                    "provider": "OpenRouter",
                    "model": "gpt-3.5-turbo",
                    "api_key": "test_key"
                }
            )
        except Exception as e:
            print("SERVER EXCEPTION CAUGHT:")
            import traceback
            traceback.print_exc()
            return False
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            try:
                err_detail = response.json().get('detail')
                print(f"Error Detail: {err_detail}")
            except:
                print(f"Error Text: {response.text}")
            return False

        content_type = response.headers.get("content-type")
        print(f"Content-Type: {content_type}")
        
        if "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" not in content_type:
             print("FAIL: Content-Type is not Excel")
             return False

        # Check file signature (PK for zip/xlsx)
        if not response.content.startswith(b'PK'):
             print("FAIL: Content does not start with PK info header")
             return False
             
        print("SUCCESS: Excel file generated correctly.")
        return True

if __name__ == "__main__":
    try:
        if test_excel_generation():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

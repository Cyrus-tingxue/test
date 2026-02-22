import sys
import os

if __name__ == "__main__":
    print("\n" + "="*50)
    print(" NOTICE: 'app.py' is DEPRECATED.")
    print(" Please run 'api_server.py' directly/use start.bat in the future.")
    print(" Starting the new FastAPI server for you...")
    print("="*50 + "\n")
    
    try:
        import uvicorn
        uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("Error: uvicorn is not installed. Please install dependencies.")
        print("pip install -r requirements.txt")
    except Exception as e:
        print(f"Error starting server: {e}")

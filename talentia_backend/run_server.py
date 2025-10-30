#!/usr/bin/env python
"""Run the FastAPI server."""

import uvicorn
import sys

if __name__ == "__main__":
    try:
        print("Starting Talentia Backend Server...")
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


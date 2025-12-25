from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import traceback

app = FastAPI(title="Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Test server running"}

@app.post("/test_upload")
async def test_upload(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")
        
        # Step 1: Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
        
        print(f"DataFrame loaded: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        return {
            "status": "success",
            "rows": df.shape[0],
            "columns": df.shape[1],
            "column_names": df.columns.tolist()
        }
        
    except Exception as e:
        error_msg = f"Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":
    import uvicorn
    print("Starting test server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)

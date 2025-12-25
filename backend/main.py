from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io



from agents.analyst_simple import run_analyst_pipeline
from agents.advisor_simple import run_advisor_agent
from utils.pdf_gen import generate_pdf_report
from fastapi.responses import StreamingResponse
import hashlib
import datetime

app = FastAPI(title="Intelligent Audit System API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "System is running"}

@app.post("/upload_and_analyze")
async def upload_analyze(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV or Excel.")
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
            
       
        analysis_result = run_analyst_pipeline(df)
        
       
        recommendations = run_advisor_agent(analysis_result)
        
      
        pdf_buffer = generate_pdf_report(analysis_result, recommendations, file.filename)
        
       
        report_hash = hashlib.sha256(pdf_buffer.getvalue()).hexdigest()
        
        
        # Prepare full data object
        full_report_data = {
            "filename": file.filename,
            "timestamp": datetime.datetime.now().isoformat(),
            "analysis": analysis_result,
            "recommendations": recommendations,
            "report_hash_preview": report_hash
        }
        
        # Save to JSON history
        saved_id = save_report_json(full_report_data)
        
        return {
            "status": "success",
            "filename": file.filename,
            "analysis": analysis_result,
            "recommendations": recommendations,
            "report_hash_preview": report_hash, 

            "timestamp": full_report_data["timestamp"],
            "id": saved_id
        }
        
    except Exception as e:
        import traceback
        error_detail = f"Analysis failed: {str(e)}\n{traceback.format_exc()}"
        print(error_detail) 

        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/test_upload")
async def test_upload(file: UploadFile = File(...)):
    """Simple test endpoint to check file upload"""
    try:
        content = await file.read()
        return {
            "status": "success",
            "filename": file.filename,
            "size": len(content),
            "type": file.content_type
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}



# Persistence Logic
REPORTS_DIR = "data/reports"
import os
import json
import uuid

if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

def save_report_json(data: dict):
    report_id = str(uuid.uuid4())
    filename = f"{data['timestamp'].replace(':', '-')}_{data['filename']}.json"
    filepath = os.path.join(REPORTS_DIR, report_id + ".json")
    
    # Enrich data with ID and initial certification status
    data["id"] = report_id
    data["is_certified"] = False # Default
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
        
    return report_id

@app.get("/reports")
async def list_reports():
    reports = []
    if not os.path.exists(REPORTS_DIR):
        return []
        
    for filename in os.listdir(REPORTS_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(REPORTS_DIR, filename), 'r') as f:
                try:
                    data = json.load(f)
                    # Return summary only
                    reports.append({
                        "id": data.get("id"),
                        "filename": data.get("filename"),
                        "timestamp": data.get("timestamp"),
                        "quality_score": data.get("analysis", {}).get("quality_analysis", {}).get("score", 0),
                        "is_certified": data.get("is_certified", False)
                    })
                except:
                    continue
                    
    # Sort by timestamp desc
    return sorted(reports, key=lambda x: x['timestamp'], reverse=True)

@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    filepath = os.path.join(REPORTS_DIR, report_id + ".json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
        
    with open(filepath, 'r') as f:
        return json.load(f)

@app.post("/reports/{report_id}/certify")
async def mark_certified(report_id: str):
    filepath = os.path.join(REPORTS_DIR, report_id + ".json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
        
    with open(filepath, 'r') as f:
        data = json.load(f)
        
    data["is_certified"] = True
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
        
    return {"status": "success", "is_certified": True}

@app.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    filepath = os.path.join(REPORTS_DIR, report_id + ".json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report not found")
    
    try:
        os.remove(filepath)
        return {"status": "success", "message": "Report deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_pdf")
async def get_pdf_endpoint(data: dict):









    try:
        analysis = data.get("analysis", {})
        recs = data.get("recommendations", "")
        fname = data.get("filename", "report")
        
        pdf_buffer = generate_pdf_report(analysis, recs, fname)
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{fname}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

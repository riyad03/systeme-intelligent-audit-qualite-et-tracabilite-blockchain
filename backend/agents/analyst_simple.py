from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import pandas as pd
import json

load_dotenv()

def run_analyst_pipeline(df: pd.DataFrame) -> dict:
    """Simple analyst that returns basic statistics without complex tools"""
    


    stats = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": df.columns.tolist(),
        "numeric_summary": {}
    }
    


    numeric_cols = df.select_dtypes(include='number').columns
    for col in numeric_cols:
        stats["numeric_summary"][col] = {
            "mean": float(df[col].mean()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "missing": int(df[col].isna().sum())
        }
    


    missing_ratio = df.isna().sum().sum() / (df.shape[0] * df.shape[1])
    quality_score = max(0, 100 - (missing_ratio * 100))
    


    issues = []
    if missing_ratio > 0.1:
        issues.append(f"High missing data: {missing_ratio*100:.1f}%")
    if df.shape[0] < 10:
        issues.append("Dataset too small")
    
    quality_analysis = {
        "score": int(quality_score),
        "issues": issues
    }
    
    return {
        "quality_analysis": quality_analysis,
        "statistics": stats,
        "final_data": df.to_json()
    }

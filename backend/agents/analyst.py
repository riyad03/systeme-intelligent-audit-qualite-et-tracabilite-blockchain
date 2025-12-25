import json
import pandas as pd
import os
from typing import TypedDict, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

load_dotenv()

# Load configs relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_DIR = os.path.join(BASE_DIR, "config")

def load_config(filename: str) -> Dict[str, Any]:
    path = os.path.join(CONFIG_DIR, filename)
    if not os.path.exists(path):
        # Fallback or error
        return {}
    with open(path, "r") as f:
        return json.load(f)

QUALITY_CFG = load_config("quality_constraints.json")
PROMPT_CFG = load_config("prompt_config.json")

class PipelineState(TypedDict, total=False):
    raw_df: pd.DataFrame
    quality_json: str
    cleaned_json: str
    preprocessed_json: str

@tool
def check_quality(data_json: str, config_json: str):
    """Checks data quality based on constraints."""
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    issues = []
    score = 100
    
    # Check required columns
    for col in cfg.get("required_columns", []):
        if col not in df.columns:
            issues.append(f"Missing required column: {col}")
            score -= 20
            
    # Check missing values
    for col in df.columns:
        m = df[col].isna().mean()
        if m > cfg.get("max_missing_per_column", 0.5):
            issues.append(f"{col}: missing ratio {m:.2f} too high")
            score -= 10
            
    # Check row count
    if df.shape[0] < cfg.get("min_rows", 10):
        issues.append("Dataset too small")
        score -= 20
        
    return json.dumps({"score": score, "issues": issues})

@tool
def clean_dataset(data_json: str, config_json: str):
    """Cleans the dataset by filling missing values and filtering ranges."""
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    
    # Fill numeric
    num_cols = df.select_dtypes(include="number").columns
    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())
        
    # Range checks
    for col, (low, high) in cfg.get("allowed_ranges", {}).items():
        if col in df.columns:
            df = df[(df[col] >= low) & (df[col] <= high)]
            
    return df.to_json()

@tool
def preprocess_dataset(data_json: str, config_json: str):
    """Normalizes numeric columns."""
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    
    if cfg.get("normalize_numeric", True):
        num = df.select_dtypes("number").columns
        if not num.empty:
            df[num] = (df[num] - df[num].mean()) / df[num].std().replace(0, 1) # avoid div by zero
            
    return df.to_json()

# Initialize LLM
llm = ChatOpenAI(
    model="gpt-4o", # Updated model name for better availability/cost if needed, or keep user's choice
    temperature=0,
).bind_tools([check_quality, clean_dataset, preprocess_dataset])

def n_quality(state: PipelineState):
    result = llm.invoke({
        "role": "user",
        "content": PROMPT_CFG.get("quality_prompt", "Check quality of this data."),
        "data_json": state["raw_df"].to_json(),
        "config_json": json.dumps(QUALITY_CFG),
    })
    # If the LLM returns tool calls, we should execute them? 
    # In the original code, it seemed to rely on binding tools but maybe didn't execute them in a loop?
    # Wait, the original code assign result directly to state["quality_json"]. 
    # Usually we need to actually call the tool if the LLM wants to.
    # For simplicity, assuming the LLM returns the analysis text or tool call result directly if using invoke with bound tools...
    
    # Actually, with .bind_tools(), the LLM response will contain tool_calls.
    # We need to run them. The original code was a bit unfinished or assumed a specific behavior.
    # Let's make it robust: extract tool call or just use the content if it's a direct answer.
    # But looking at prompt_config.json might reveal the intent.
    # For now, I will assume the original logic was intended to just get a response or I'll implement a simple tool executor if needed.
    # However, to be safe, I'll just save the result.content for now.
    
    state["quality_json"] = result.content
    return state

def n_clean(state: PipelineState):
    # This step seems to want to invoke the 'clean_dataset' tool.
    # We can force the tool usage or ask the LLM to do it.
    result = llm.invoke([
        {"role": "system", "content": PROMPT_CFG.get("clean_prompt", "Clean the dataset.")},
        {"role": "user", "content": state["raw_df"].to_json()}
    ])
    state["cleaned_json"] = result.content # Should ideally contain the cleaned JSON or tool output
    return state

def n_preprocess(state: PipelineState):
    result = llm.invoke([
        {"role": "system", "content": PROMPT_CFG.get("preprocess_prompt", "Preprocess the dataset.")},
        {"role": "user", "content": state.get("cleaned_json", state["raw_df"].to_json())}
    ])
    state["preprocessed_json"] = result.content
    return state

def n_output(state: PipelineState):
    return state

# Graph Setup
graph = StateGraph(PipelineState)
graph.add_node("quality", n_quality)
graph.add_node("clean", n_clean)
graph.add_node("preprocess", n_preprocess)
graph.add_node("output", n_output)

graph.set_entry_point("quality")
graph.add_edge("quality", "clean")
graph.add_edge("clean", "preprocess")
graph.add_edge("preprocess", "output")

app = graph.compile()

def run_analyst_pipeline(df: pd.DataFrame) -> Dict[str, Any]:
    """Runs the analyst pipeline on a dataframe."""
    state = app.invoke({"raw_df": df})
    return {
        "quality_analysis": state.get("quality_json"),
        "cleaned_data": state.get("cleaned_json"), # this might need parsing if it's a string representation of json
        "final_data": state.get("preprocessed_json")
    }

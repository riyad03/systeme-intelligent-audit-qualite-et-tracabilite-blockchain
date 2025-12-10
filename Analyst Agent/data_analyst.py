import json
import pandas as pd
import requests
from typing import TypedDict

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langgraph.graph import StateGraph, END

load_dotenv()

with open("quality_constraints.json") as f:
    QUALITY_CFG = json.load(f)

with open("prompt_config.json") as f:
    PROMPT_CFG = json.load(f)


class PipelineState(TypedDict, total=False):
    raw_df: pd.DataFrame
    quality_json: str
    cleaned_json: str
    preprocessed_json: str


@tool
def check_quality(data_json: str, config_json: str):
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    issues = []
    score = 100
    for col in cfg["required_columns"]:
        if col not in df.columns:
            issues.append(f"Missing required column: {col}")
            score -= 20
    for col in df.columns:
        m = df[col].isna().mean()
        if m > cfg["max_missing_per_column"]:
            issues.append(f"{col}: missing ratio {m:.2f} too high")
            score -= 10
    if df.shape[0] < cfg["min_rows"]:
        issues.append("Dataset too small")
        score -= 20
    return json.dumps({"score": score, "issues": issues})


@tool
def clean_dataset(data_json: str, config_json: str):
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    num_cols = df.select_dtypes(include="number").columns
    for col in num_cols:
        df[col] = df[col].fillna(df[col].median())
    for col, (low, high) in cfg["allowed_ranges"].items():
        if col in df.columns:
            df = df[(df[col] >= low) & (df[col] <= high)]
    return df.to_json()


@tool
def preprocess_dataset(data_json: str, config_json: str):
    df = pd.read_json(data_json)
    cfg = json.loads(config_json)
    if cfg.get("normalize_numeric", True):
        num = df.select_dtypes("number").columns
        df[num] = (df[num] - df[num].mean()) / df[num].std()
    return df.to_json()


llm = ChatOpenAI(
    model="gpt-5",
    temperature=0,
    max_tokens=2000,
).bind_tools([check_quality, clean_dataset, preprocess_dataset])


def n_quality(state: PipelineState):
    result = llm.invoke({
        "role": "user",
        "content": PROMPT_CFG["quality_prompt"],
        "data_json": state["raw_df"].to_json(),
        "config_json": json.dumps(QUALITY_CFG),
    })
    state["quality_json"] = result
    return state


def n_clean(state: PipelineState):
    result = llm.invoke({
        "role": "user",
        "content": PROMPT_CFG["clean_prompt"],
        "data_json": state["raw_df"].to_json(),
        "config_json": json.dumps(QUALITY_CFG)
    })
    state["cleaned_json"] = result
    return state


def n_preprocess(state: PipelineState):
    result = llm.invoke({
        "role": "user",
        "content": PROMPT_CFG["preprocess_prompt"],
        "data_json": state["cleaned_json"],
        "config_json": json.dumps(QUALITY_CFG)
    })
    state["preprocessed_json"] = result
    return state


def n_output(state: PipelineState):
    return state


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


def send_to_api(data_json: str, api_url: str):
    df = pd.read_json(data_json)
    return requests.post(api_url, json=df.to_dict(orient="records"))


def run_pipeline(path: str, api_url: str):
    raw = pd.read_csv(path)
    state = app.invoke({"raw_df": raw})
    final_json = state["preprocessed_json"]
    return send_to_api(final_json, api_url)


if __name__ == "__main__":
    run_pipeline("input.csv", "https://your-api/predict")

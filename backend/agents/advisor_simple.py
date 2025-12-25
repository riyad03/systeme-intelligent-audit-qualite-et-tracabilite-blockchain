from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def run_advisor_agent(analysis_json: dict) -> str:
    """Simple advisor that generates recommendations based on analysis"""
    
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    


    stats = analysis_json.get("statistics", {})
    quality = analysis_json.get("quality_analysis", {})
    
    prompt_text = f"""You are a generic Senior Business Consultant. 
    Analyze the provided data statistics and quality metrics to generate a professional Strategic Audit Report.
    
    **Analysis Context:**
    - Data Quality Score: {quality.get('score', 0)}/100
    - Row Count: {stats.get('rows', 0)}
    - Issues: {', '.join(quality.get('issues', ['None']))}

    **Output Requirements:**
    Return the response in strict **Markdown** format with the following sections:

    # Executive Summary
    [Brief high-level assessment of the data health and operational status]

    ## Critical Operational Risks
    [List 2-3 major risks derived from data quality or missing values]

    ## Strategic Opportunities
    [List 3 actionable recommendations to improve performance]

    ## Immediate Actions
    [Bulleted list of immediate next steps]

    **Tone:** Professional, direct, and actionable. Use **bold** for emphasis.
    
    **CONSTRAINT:** Do NOT use any emojis or icons in the output. The output must be strictly text-based.
    """
    
    result = llm.invoke(prompt_text)
    return result.content

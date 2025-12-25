from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

def run_advisor_agent(analysis_json: dict) -> str:
    """
    Takes the analysis result from Agent 1 and generates business recommendations.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    
    prompt = PromptTemplate.from_template(
        """
        You are an expert Business Advisor holding a doctorate in operation management.
        
        Analyze the following data analysis report and statistical findings:
        {analysis_json}
        
        Provide a structured set of actionable recommendations to improve performance, reduce delays, and correct anomalies.
        Your response must be in clear markdown format.
        
        Focus on:
        1. Operational Excellence
        2. Risk Mitigation
        3. Strategic Opportunities

        **CONSTRAINT:** Do NOT use any emojis or icons in the output. The output must be strictly text-based.
        """
    )
    
    chain = prompt | llm
    
    # Check if analysis_json contains 'final_data' or other keys, convert to string
    input_str = str(analysis_json)
    
    result = chain.invoke({"analysis_json": input_str})
    return result.content

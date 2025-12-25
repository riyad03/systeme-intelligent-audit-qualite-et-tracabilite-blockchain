from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import io
import json

def generate_pdf_report(analysis_data: dict, recommendations: str, filename: str = "report.pdf") -> io.BytesIO:
    """
    Generates a PDF report containing analysis stats and recommendations.
    Returns a BytesIO object.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []



    title_style = styles['Title']
    story.append(Paragraph(f"Audit & Traceability Report: {filename}", title_style))
    story.append(Spacer(1, 12))



    story.append(Paragraph("1. Data Analysis Summary", styles['Heading1']))
    


    qual = analysis_data.get("quality_analysis")
    if qual:


        if isinstance(qual, str):
            try:
                qual = json.loads(qual)
            except:
                pass
        
        if isinstance(qual, dict):
            score = qual.get("score", "N/A")
            story.append(Paragraph(f"Data Quality Score: {score}/100", styles['Normal']))
            issues = qual.get("issues", [])
            if issues:
                story.append(Paragraph("Issues Found:", styles['Heading3']))
                for issue in issues:
                    story.append(Paragraph(f"- {issue}", styles['Normal']))
        else:
             story.append(Paragraph(f"Quality Analysis: {str(qual)}", styles['Normal']))

    story.append(Spacer(1, 12))



    story.append(Paragraph("2. AI Recommendations", styles['Heading1']))


    
    for line in recommendations.split('\n'):
        if line.strip():
            story.append(Paragraph(line, styles['Normal']))
            story.append(Spacer(1, 4))
            
    doc.build(story)
    buffer.seek(0)
    return buffer

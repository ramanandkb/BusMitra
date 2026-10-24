import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

SAMPLE_PASSENGERS = [
    ("1A", "Rajesh Sharma", "9823012345", "Pune - Swargate", "Bangalore - Majestic", "VRL901234"),
    ("1B", "Pooja Sharma", "9823012346", "Pune - Swargate", "Bangalore - Majestic", "VRL901234"),
    ("1C", "Amit Patil", "9822198765", "Pune - Wakad", "Hubli - Old Bus Stand", "VRL901235"),
    ("1D", "Suresh Deshmukh", "9422011223", "Pune - Wakad", "Bangalore - Majestic", "VRL901236"),
    ("2A", "Sneha Kulkarni", "9970144556", "Pune - Katraj", "Belgaum - Bypass", "VRL901237"),
    ("2B", "Rohan Joshi", "9881233445", "Pune - Katraj", "Bangalore - Majestic", "VRL901238"),
    ("2C", "Vikram Rathore", "9766554433", "Satara - Highway", "Davanagere - ByPass", "VRL901239"),
    ("2D", "Ananya Verma", "9890112233", "Satara - Highway", "Bangalore - Majestic", "VRL901240"),
    ("3A", "Deepak Chawla", "9850123987", "Kolhapur - Bus Stand", "Tumkur", "VRL901241"),
    ("3B", "Meena Chawla", "9850123988", "Kolhapur - Bus Stand", "Tumkur", "VRL901241"),
    ("3C", "Gaurav More", "9822998877", "Pune - Swargate", "Bangalore - Majestic", "VRL901242"),
    ("3D", "Priyanka Shinde", "9923445566", "Pune - Swargate", "Hubli - Old Bus Stand", "VRL901243"),
    ("4A", "Karan Malhotra", "9820011224", "Pune - Wakad", "Bangalore - Majestic", "VRL901244"),
    ("4B", "Sunita Nair", "9845012345", "Pune - Wakad", "Bangalore - Majestic", "VRL901245"),
    ("4C", "Manoj Kumar", "9731234567", "Kolhapur - Bus Stand", "Bangalore - Majestic", "VRL901246"),
    ("4D", "Neha Gupta", "9654321098", "Pune - Katraj", "Bangalore - Majestic", "VRL901247")
]

def generate_sample_manifest_pdf(output_path: str = "sample_manifest.pdf") -> str:
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30
    )
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        alignment=1,
        textColor=colors.HexColor("#1A365D")
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#4A5568")
    )

    story.append(Paragraph("ROYAL INTERCITY EXPRESS - PASSENGER MANIFEST", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Route: Pune to Bangalore | Bus No: MH 12 QX 4521 | Journey Date: 2026-10-25 | Departure: 20:30", subtitle_style))
    story.append(Spacer(1, 14))

    # Table data
    data = [["Seat", "Passenger Name", "Mobile No", "Boarding Point", "Drop-off Point", "PNR Ref"]]
    for row in SAMPLE_PASSENGERS:
        data.append(list(row))

    t = Table(data, colWidths=[45, 120, 95, 115, 115, 65])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
    ]))

    story.append(t)
    doc.build(story)
    return output_path

if __name__ == "__main__":
    generate_sample_manifest_pdf()

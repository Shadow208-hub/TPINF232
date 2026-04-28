from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
import io 
import base64


def generate_pdf(data: dict, filename="rapport.pdf"):
    """Génère un rapport PDF à partir des données statistiques et ML"""
    doc = SimpleDocTemplate(filename)
    styles = getSampleStyleSheet()
    elements = []
    
    # Titre
    elements.append(Paragraph("Rapport d'analyse des donnees", styles["Title"]))
    elements.append(Spacer(1, 12))
    
    # Statistiques
    elements.append(Paragraph("Statistiques:", styles["Heading2"]))
    for key, value in data["statistiques"].items():
        if key != "Histogramme_age":
            elements.append(Paragraph(f"<b>{key}</b>: {value}", styles["Normal"]))
    elements.append(Spacer(1, 12))
    
    # Histogramme des âges
    if "Histogramme_age" in data["statistiques"]:
        try:
            img_data = base64.b64decode(data["statistiques"]["Histogramme_age"])
            img_io = io.BytesIO(img_data)
            img = Image(img_io, width=400, height=300)
            elements.append(img)
            elements.append(Spacer(1, 12))
        except Exception as e:
            elements.append(Paragraph(f"Erreur lors du chargement du graphique: {str(e)}", styles["Normal"]))
    
    # Machine Learning (si disponible)
    if data.get("ml") is not None:
        elements.append(Paragraph("Resultats Machine Learning:", styles["Heading2"]))
        elements.append(Paragraph(f"<b>R2_score</b>: {data['ml']['R2_score']:.4f}", styles["Normal"]))
        elements.append(Paragraph(f"<b>MSE</b>: {data['ml'].get('MSE', data['ml'].get('mse', 0)):.4f}", styles["Normal"]))  # Correction: MSE au lieu de MAE
        elements.append(Paragraph(f"<b>Intercept</b>: {data['ml']['intercept']:.4f}", styles["Normal"]))
        elements.append(Spacer(1, 12))
        
        # Graphique ML
        if "graphique" in data["ml"]:
            try:
                img_data = base64.b64decode(data["ml"]["graphique"])
                img_io = io.BytesIO(img_data)
                img = Image(img_io, width=400, height=300)
                elements.append(img)
            except Exception as e:
                elements.append(Paragraph(f"Erreur lors du chargement du graphique ML: {str(e)}", styles["Normal"]))
    else:
        elements.append(Paragraph("Machine Learning: Pas assez de donnees pour l'analyse", styles["Heading2"]))
    
    # Construire le PDF
    doc.build(elements)
    return filename

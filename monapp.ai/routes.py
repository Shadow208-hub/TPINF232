from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from shema_response import DataBase, DataResponse, DataUpdate
from models import Data
import pandas as pd
from analystics import stat, analyse_age, analyse_par_domaine, regression, correlation, analyse_grouper, train_model
from pdf_rapport import generate_pdf

router = APIRouter(prefix="/donnees", tags=["informations"])


@router.post("/", response_model=DataResponse, status_code=status.HTTP_201_CREATED)
def savedate(donnee: DataBase, db: Session = Depends(get_db)):
    """Enregistrer une nouvelle donnée"""
    new_data = Data(**donnee.dict())
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return new_data


@router.get("/rapport-stats-globale", status_code=status.HTTP_200_OK)  # Correction: orthographe de l'endpoint
def rapport(db: Session = Depends(get_db)):
    """Générer un rapport statistique global"""
    query_data = db.query(Data).all()
    if not query_data:
        raise HTTPException(status_code=404, detail="DATA NOT FOUND")
    data_for = []
    for d in query_data:
        data_for.append({
            "age": d.age,
            "Sexe": d.Sexe.value,
            "Domaine": d.Domaine.value,
            "Frequence": d.Frequence,
            "Temps_moyen": d.Temps_moyen.value,
            "Niveau_etude": d.Niveau_etude.value  # Ajout pour cohérence
        })
    df = pd.DataFrame(data_for)
    return {
        "General": stat(df),
        "Groupes": analyse_grouper(df),
        "rapport_avec_age": analyse_age(df),
        "Regression": regression(df),
        "correlation": correlation(df)
    }


@router.get("/rapport-ml", status_code=status.HTTP_200_OK)
def rapport_ml(db: Session = Depends(get_db)):
    """Générer un rapport de Machine Learning"""
    data = db.query(Data).all()
    if len(data) < 5:
        raise HTTPException(status_code=400, detail="PAS ASSEZ DE DONNEES POUR LE ML")
    data_list = []
    for d in data:
        data_list.append({
            "age": d.age,
            "Sexe": d.Sexe.value,
            "Domaine": d.Domaine.value,
            "Frequence": d.Frequence,
            "Niveau_etude": d.Niveau_etude.value
        })
    df = pd.DataFrame(data_list)
    result = train_model(df)
    interpretation = ""
    if result["R2_score"] > 0.7:
        interpretation = "LE MODELE EXPLIQUE BIEN LE COMPORTEMENT"
    elif result["R2_score"] > 0.4:
        interpretation = "LE MODELE EST MOYEN, DONNEES A AMELIORER"
    else:
        interpretation = "LE MODELE EST FAIBLE, PEU DE CORRELATION"
    
    return {
        "model": result,
        "Interpretation": interpretation
    }

@router.get("/rapport-pdf/generate", status_code=status.HTTP_200_OK)  # Correction: endpoint modifié pour éviter conflit
def rapport_pdf(db: Session = Depends(get_db)):
    """Générer un rapport PDF"""
    data = db.query(Data).all()
    if not data:
        raise HTTPException(status_code=404, detail="NO DATA")
    data_list = []
    for d in data:
        data_list.append({
            "age": d.age,
            "Sexe": d.Sexe.value,
            "Domaine": d.Domaine.value,
            "Frequence": d.Frequence,
            "Niveau_etude": d.Niveau_etude.value
        })
    df = pd.DataFrame(data_list)
    
    # Vérifier qu'il y a assez de données pour le ML
    if len(df) < 5:
        statistics = stat(df)
        pdf_data = {
            "statistiques": statistics,
            "ml": None  # Pas de ML si pas assez de données
        }
    else:
        statistics = stat(df)
        ml_result = train_model(df)
        pdf_data = {
            "statistiques": statistics,
            "ml": ml_result
        }
    
    file_path = generate_pdf(pdf_data)
    return FileResponse(file_path, media_type="application/pdf", filename="rapport.pdf")


@router.get("/analyse-grouper", status_code=status.HTTP_200_OK)
def get_analyse_grouper(db: Session = Depends(get_db)):
    """Route pour l'analyse groupée par niveau d'étude"""
    data = db.query(Data).all()
    if not data:
        raise HTTPException(status_code=404, detail="Pas de données disponibles")
    data_list = []
    for d in data:
        data_list.append({
            "age": d.age,
            "Sexe": d.Sexe.value if hasattr(d.Sexe, 'value') else d.Sexe,
            "Domaine": d.Domaine.value if hasattr(d.Domaine, 'value') else d.Domaine,
            "Frequence": d.Frequence,
            "Niveau_etude": d.Niveau_etude.value if hasattr(d.Niveau_etude, 'value') else d.Niveau_etude
        })
    df =  pd.DataFrame(data_list)
    return analyse_grouper(df)


@router.get("/groupement-data", status_code=status.HTTP_200_OK)
def get_groupement_data(db: Session = Depends(get_db)):
    """Route pour le groupement général des données"""
    data = db.query(Data).all()
    if not data:
        raise HTTPException(status_code=404, detail="Pas de données disponibles")
    data_list = []
    for d in data:
        data_list.append({
            "age": d.age,
            "Sexe": d.Sexe.value if hasattr(d.Sexe, 'value') else d.Sexe,
            "Domaine": d.Domaine.value if hasattr(d.Domaine, 'value') else d.Domaine,
            "Frequence": d.Frequence,
            "Niveau_etude": d.Niveau_etude.value if hasattr(d.Niveau_etude, 'value') else d.Niveau_etude
        })
    df =  pd.DataFrame(data_list)
    return analyse_par_domaine(df)


@router.get("/", response_model=List[DataResponse], status_code=status.HTTP_200_OK)
def get_data(db: Session = Depends(get_db)):
    """Récupérer toutes les données"""
    infos = db.query(Data).all()
    if not infos:
        raise HTTPException(status_code=404, detail="NO DATA FOUND")
    return infos


@router.get("/{donnee_id}", response_model=DataResponse, status_code=status.HTTP_200_OK)
def get_by_id(donnee_id: int, db: Session = Depends(get_db)):
    """Récupérer une donnée par son ID"""
    infos_id = db.query(Data).filter(Data.id == donnee_id).first()
    if not infos_id:
        raise HTTPException(status_code=404, detail="DONNEES INTROUVABLES")
    return infos_id


@router.put("/{donnee_id}", response_model=DataResponse, status_code=status.HTTP_200_OK)
def edit_data(donnee_id: int, info: DataUpdate, db: Session = Depends(get_db)):
    """Modifier une donnée existante"""
    infos2_id = db.query(Data).filter(Data.id == donnee_id).first()
    if not infos2_id:
        raise HTTPException(status_code=404, detail="DONNEES INTROUVABLES")
    update = info.dict(exclude_unset=True)
    for field, value in update.items():
        setattr(infos2_id, field, value)
    db.commit()
    db.refresh(infos2_id)
    return infos2_id


@router.delete("/{donnee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data(donnee_id: int, db: Session = Depends(get_db)):
    """Supprimer une donnée"""
    del_data = db.query(Data).filter(Data.id == donnee_id).first()
    if not del_data:
        raise HTTPException(status_code=404, detail="DONNEES INTROUVABLES")
    db.delete(del_data)
    db.commit()
    return None


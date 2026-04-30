import numpy as np
import pandas as pd
import io
import base64
import matplotlib.pyplot as plt
from models import Data, DOMAINE
from database import get_db
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sqlalchemy.orm import Session


def histogramme(fig):
    """Sauvegarde du graphique en base64"""
    saver = io.BytesIO()
    fig.savefig(saver, format='png')
    plt.close(fig)
    saver.seek(0)
    return base64.b64encode(saver.read()).decode('utf-8')
    

def stat(df: pd.DataFrame):
    """Statistiques générales"""
    if df is None or df.empty:
        return {
            "Age_moyen": 0.0,
            "Age_median": 0.0,
            "frequence_sexe": {},
            "Histogramme_age": ""
    }   
    Frequences_sexe = df['Sexe'].value_counts().to_dict()
    age_moyen = df['age'].mean()
    age_median = df['age'].median()
    fig, ax = plt.subplots(figsize=(6, 9))
    df['age'].hist(bins=10, color='skyblue', edgecolor='black', ax=ax)
    ax.set_title("Distribution des ages")
    ax.set_xlabel("Ages")
    ax.set_ylabel("Nombre")
    
    return {
        "Age_moyen": float(age_moyen),
        "Age_median": float(age_median),
        "frequence_sexe": Frequences_sexe,
        "Histogramme_age": histogramme(fig)
    }
    

def analyse_age(df: pd.DataFrame):
    """Analyse de la corrélation entre âge et fréquence"""
    if df is None or df.empty or len(df) < 2:
        return {
            "Coefficient de correlation": 0.0,
            "Graphique": ""
        }
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df['Frequence'] = pd.to_numeric(df['Frequence'], errors='coerce')
    df = df.dropna()
    if len(df) < 2:
        return {
            "Coefficient de correlation": 0.0,
            "Graphique": ""
        }
    correlation = df['age'].corr(df['Frequence'])
    # Nuage de points
    if np.isnan(correlation):
        correlation = 0.0
        
    fig, ax = plt.subplots(figsize=(6, 9))
    ax.scatter(df['age'], df['Frequence'], alpha=0.5)
    ax.set_title(f"Correlation age / Frequence (R={correlation:.2f})")
    ax.set_xlabel("Age")
    ax.set_ylabel("Frequence d'utilisation")
    
    return {
        "Coefficient_de_correlation": float(correlation),
        "Graphique": histogramme(fig)
    }
    

def analyse_par_domaine(df: pd.DataFrame):
    """Analyse par domaine"""
    df['Domaine'] = df["Domaine"].apply(lambda x: x.value if hasattr(x, 'value') else x)
    stat_domaine = df.groupby('Domaine')['Frequence'].mean().to_dict()
    fig, axc = plt.subplots(figsize=(5, 9))
    df.groupby('Domaine')['Frequence'].mean().plot(kind='bar', ax=axc)
    axc.set_title("Utilisation moyenne par domaine")
    axc.set_xlabel("Domaine")
    axc.set_ylabel("Frequence d'utilisation")
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    return {
        "Moyenne_par_domaine": stat_domaine,
        "Graphique_de_domaine": histogramme(fig)
    }
    

def analyse_grouper(df: pd.DataFrame):
    """Analyse groupée par catégorie"""
    df['Sexe'] = df["Sexe"].apply(lambda x: x.value if hasattr(x, 'value') else x)
    par_sexe = df.groupby("Sexe")["Frequence"].mean().to_dict()
    df["Niveau_etude"] = df["Niveau_etude"].apply(lambda x: x.value if hasattr(x, 'value') else x)
    par_niveau = df.groupby("Niveau_etude")["Frequence"].mean().to_dict()
    return {
        "frequence_par_sexe": par_sexe,
        "frequence_par_niveau": par_niveau
    }
    

def regression(df: pd.DataFrame):
    """Droite de régression entre les âges et les fréquences d'utilisation"""
    x = df["age"]
    y = df["Frequence"]
    if len(df) < 2:
        return {"Pente": 0.0, "Ordonnee": 0.0, "graphique": ""}
    coef = np.polyfit(x, y, 1)
    a, b = coef

    # Sécurité NaN
    a = 0.0 if np.isnan(a) else float(a)
    b = 0.0 if np.isnan(b) else float(b)
    
    fig, ax = plt.subplots()
    ax.scatter(x, y)
    ax.plot(x, a * x + b, color='red')
    ax.set_title(f"Regression (y={a:.2f}x + {b:.2f})")
    ax.set_xlabel("Age")
    ax.set_ylabel("Frequence")
    
    return {
        "Pente": float(a),
        "Ordonnee": float(b),
        "graphique": histogramme(fig)
    }
    

def correlation(df: pd.DataFrame):
    """Matrice de corrélation"""
    if df is None or df.empty or len(df) < 2:
        return {
            "Matrice": {},
            "heatmap": ""
        }
        
    num = df.copy()
    # CORRECTION: Nom de colonne corrigé de "Niveau_etudes" à "Niveau_etude"
    cols_to_encode = ["Sexe", "Domaine", "Niveau_etude"]
    for col in cols_to_encode:
        if col in num.columns:
            num[col] = num[col].astype("category").cat.codes
    
    num = num.select_dtypes(include=[np.number])  # Corrélation uniquement sur le numérique
    if num.shape[1]<2:
        return {
            "matrice": {},
            "heatmap": ""
        }
        
    corr_filled = corr.fillna(0)
    
    fig, ax = plt.subplots(figsize=(8, 6))
    cax = ax.matshow(corr, cmap='coolwarm')
    fig.colorbar(cax)
    
    ax.set_xticks(range(len(corr.columns)), corr.columns, rotation=45)
    ax.set_yticks(range(len(corr.columns)), corr.columns)
    plt.tight_layout()
    
    return {
        "matrice": corr.to_dict(),
        "heatmap": histogramme(fig)
    }
    

def transform_data(df: pd.DataFrame):
    """Encoder les variables pour le ML"""
    ml = df.copy()
    # Encoder les variables
    for col in ['Sexe', 'Domaine', 'Niveau_etude']:
        if col in ml.columns:
            ml[col] = ml[col].astype("category").cat.codes
    return ml
    

def train_model(df: pd.DataFrame):
    """Entraînement du modèle de régression linéaire"""
    ml = transform_data(df)
    X = ml[['age', 'Sexe', 'Domaine', 'Niveau_etude']]
    Y = ml['Frequence']
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, Y_train)
    predictions = model.predict(X_test)
    mse = mean_squared_error(Y_test, predictions)
    r2 = r2_score(Y_test, predictions)
    # Graphique réel vs prédiction
    fig, ax = plt.subplots()
    ax.scatter(Y_test, predictions)
    ax.set_xlabel("Valeurs reelles")
    ax.set_ylabel("Predictions")
    ax.set_title("Reel vs Prediction")
    
    # Gestion des valeurs NaN/Inf
    mse = 0.0 if np.isnan(mse) or np.isinf(mse) else float(mse)
    r2 = 0.0 if np.isnan(r2) or np.isinf(r2) else float(r2)
    intercept = 0.0 if np.isnan(model.intercept_) else float(model.intercept_)
    
    # Ajouter ligne diagonale pour référence
    min_val = min(Y_test.min(), predictions.min())
    max_val = max(Y_test.max(), predictions.max())
    ax.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2)
    
    return {
        "MSE": float(mse),
        "R2_score": float(r2),
        "coefficient": model.coef_.tolist(),
        "intercept": float(intercept),
        "graphique": histogramme(fig)
    }

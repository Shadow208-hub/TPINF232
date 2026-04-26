from sqlalchemy import Integer, Column, Enum
from database import moteur, Base
import enum

class SEXE(enum.Enum):
    M = "Masculin"
    F = "Feminin"
    

class Niveauetudes(enum.Enum):
    PRIMAIRE = "primaire"
    LYCEE = "lycee"
    BAC = "Baccalaureat"
    LICENCE = "Licence"
    MASTER = "Master"
    DOCTORAT = "Doctorat"
   

class DOMAINE(enum.Enum):
    INFORMATIQUE = "Informatique"
    INGENIERIE = "Ingenierie"
    BATIMENT = "Batiment"
    MEDECINE = "Medecine"
    ETUDES = "Etudes"
    FINANCES = "Finances"
    AUTRES = "Autres"
    

class TempsMoyen(enum.Enum):
    MOINS_5 = "1-5 min"
    ENTRE_5_15 = "5-15 min"
    ENTRE_15_30 = "15-30 min"
    ENTRE_30_60 = "30-60 min"
    PLUS_60 = "60 min+"


class Utilisation(enum.Enum):
    ETUDES = "etudes"
    TRAVAIL = "Travail"
    DIVERTISSEMENT = "divertissement"
   

class Data(Base):
    __tablename__ = "informations"
    
    id = Column(Integer, primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    Sexe = Column(Enum(SEXE), nullable=False)
    Niveau_etude = Column(Enum(Niveauetudes), nullable=False)  # Correction: nom cohérent
    Domaine = Column(Enum(DOMAINE), nullable=False)
    Frequence = Column(Integer, nullable=False)
    Temps_moyen = Column(Enum(TempsMoyen), nullable=False)
    Type_utilisation = Column(Enum(Utilisation), nullable=False)
   

def create_table():
    Base.metadata.create_all(bind=moteur)

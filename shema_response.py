from pydantic import BaseModel, Field
from typing import Optional
from models import SEXE, DOMAINE, Utilisation, Niveauetudes, TempsMoyen


class DataBase(BaseModel):
    age: int 
    Niveau_etude: Niveauetudes
    Sexe: SEXE 
    Domaine: DOMAINE 
    Frequence: int 
    Temps_moyen: TempsMoyen
    Type_utilisation: Utilisation
    

class Datasave(DataBase):
    pass 


class DataUpdate(BaseModel):
    age: Optional[int] = Field(None)
    Niveau_etude: Optional[Niveauetudes] = Field(None)
    Sexe: Optional[SEXE] = Field(None)
    Domaine: Optional[DOMAINE] = Field(None) 
    Frequence: Optional[int] = Field(None) 
    Temps_moyen: Optional[TempsMoyen] = Field(None)
    Type_utilisation: Optional[Utilisation] = Field(None)
    

class DataResponse(DataBase):
    id: int
    
    class Config:
        from_attributes = True
        use_enum_values = True # Correction: orthographe

from fastapi import FastAPI
from routes import router
from fastapi.middleware.cors import CORSMiddleware
from models import create_table
from fastapi.responses import FileResponse
# Créer les tables
create_table()

app = FastAPI(
    title="Mon API backend d'etude statistique",
    description="Backend de l'app sur une etude statistique entre l'age et le nombre d'utilisation journaliere de l'IA"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Autorise tout le monde (pour le développement)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

# Route pour le public (Lien normal)
@app.get("/")
async def read_public():
    return FileResponse("index.html")

# Route pour le prof (Lien secret)
@app.get("/prof-admin-2026")
async def read_admin():
    return FileResponse("admin.html")

@app.get("/", tags=["Root"])
def root():
    """Endpoint racine pour vérifier que l'API est en ligne"""
    return {
        "message": "L'API est en ligne",
        "documentation": "http://127.0.0.1:8000/docs",
        "status": "running"
    }

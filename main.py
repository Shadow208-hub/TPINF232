from fastapi import FastAPI
from routes import router
from fastapi.middleware.cors import CORSMiddleware
from models import create_table
from fastapi.responses import FileResponse

# Créer les tables au démarrage
create_table()

app = FastAPI(
    title="Mon API backend d'étude statistique",
    description="Backend de l'app sur une étude statistique entre l'âge et le nombre d'utilisation journalière de l'IA"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static" StaticFiles(directory="."), name="static")
app.include_router(router)

# Route pour le public (Lien normal) : Affiche le formulaire simple
@app.get("/")
async def read_public():
    return FileResponse("index.html")

# Route pour le prof (Lien secret) : Affiche l'interface complète
@app.get("/prof-admin-2026")
async def read_admin():
    return FileResponse("admin.html")
    

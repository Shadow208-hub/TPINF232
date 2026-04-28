from fastapi import FastAPI
from routes import router
from fastapi.middleware.cors import CORSMiddleware
from models import create_table
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Créer les tables au démarrage
create_table()

app = FastAPI(
    title="Mon API backend d'étude statistique",
    description="Backend de l'app sur une étude statistique entre l'âge et le nombre d'utilisation journalière de l'IA"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tpinf232-yohr.onrender.com", "http://localhost:5500", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")
else:
    app.mount("/static", StaticFiles(directory="."), name="static")
app.include_router(router)

# Route pour le public (Lien normal) : Affiche le formulaire simple
@app.get("/")
async def read_public():
    return FileResponse("formulaire.html")

# Route pour le prof (Lien secret) : Affiche l'interface complète
@app.get("/prof-admin-2026")
async def read_admin():
    return FileResponse("index.html")
    

from fastapi import FastAPI
from routes import router
from fastapi.middleware.cors import CORSMiddleware
from models import create_table
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

# Créer les tables au démarrage
create_table()

app = FastAPI(
    title="Mon API backend d'étude statistique",
    description="Backend de l'app sur une étude statistique entre l'âge et le nombre d'utilisation journalière de l'IA"
)

app.add_middleware(
    CORSMiddleware,
    # ✅ CORRECTION : Ajout des origines locales FastAPI (port 8000) pour les tests en développement
    allow_origins=[
        "https://tpinf232-yohr.onrender.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "API StatAI operationnelle. )

            
app.include_router(router)
PORT = int(os.environ.get("PORT", 8000))  

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)

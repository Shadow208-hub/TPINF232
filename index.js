// --- MACHINE À ÉCRIRE ---
const phrases = ["l'Informatique", "la Médecine", "l'Ingénierie", "votre Avenir"];
let i = 0, j = 0, isDel = false;

function type() {
    const text = document.getElementById('typewriter');
    if (!text) return;
    const curr = phrases[i];
    text.innerText = isDel ? curr.substring(0, j--) : curr.substring(0, j++);
    if (!isDel && j > curr.length) { isDel = true; setTimeout(type, 2000); }
    else if (isDel && j === 0) { isDel = false; i = (i + 1) % phrases.length; setTimeout(type, 500); }
    else setTimeout(type, isDel ? 50 : 150);
}

// --- CONFIGURATION DYNAMIQUE DE L'API ---
// Détecte automatiquement si on est en local ou sur Render
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? "http://127.0.0.1:8000" 
    : window.location.origin;

console.log("Connecté au backend via :", API_BASE_URL);

// --- FORMULAIRE ---
const dataForm = document.getElementById('dataForm');
if (dataForm) {
    dataForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (localStorage.getItem('form_envoye')) {
            return Swal.fire('Attention', 'Vous avez déjà rempli ce formulaire.', 'warning');
        }

        const payload = {
            age: parseInt(document.getElementById('age').value),
            Sexe: document.getElementById('sexe').value,
            Domaine: document.getElementById('domaine').value,
            Frequence: parseInt(document.getElementById('frequence').value),
            Niveau_etude: document.getElementById('niveau_etude').value,
            Temps_moyen: "1h-2h" 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/donnees/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Swal.fire('Succès !', 'Vos données ont été enregistrées avec succès.', 'success');
                localStorage.setItem('form_envoye', 'true');
                dataForm.reset();
            } else {
                const errorData = await response.json().catch(() => ({}));
                Swal.fire('Erreur', errorData.detail || 'Un problème est survenu lors de l\'envoi.', 'error');
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            Swal.fire('Erreur Serveur', 'L\'API n\'est pas accessible.', 'error');
        }
    });
}

// --- LOGIQUE GRAPHIQUE ---
let myChart = null;

function renderChart(data) {
    const canvas = document.getElementById('myChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();

    let labels = [];
    let values = [];

    // Extraction des données selon le format de l'API
    if (data.General && data.General.frequence_sexe) {
        labels = Object.keys(data.General.frequence_sexe);
        values = Object.values(data.General.frequence_sexe);
    } else if (data.frequence_par_sexe) {
        labels = Object.keys(data.frequence_par_sexe);
        values = Object.values(data.frequence_par_sexe);
    } else if (data.Moyenne_par_domaine) {
        labels = Object.keys(data.Moyenne_par_domaine);
        values = Object.values(data.Moyenne_par_domaine);
    } else {
        labels = Object.keys(data).filter(k => typeof data[k] !== 'object');
        values = labels.map(k => data[k]);
    }

    if (labels.length === 0) return;

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Statistiques',
                data: values,
                backgroundColor: ['#38bdf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa'],
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

// --- CONTACTS ---
function choisirContact() {
    Swal.fire({
        title: 'Me contacter',
        showDenyButton: true,
        confirmButtonText: 'WhatsApp',
        denyButtonText: 'Email',
        confirmButtonColor: '#25D366',
        denyButtonColor: '#38bdf8'
    }).then((result) => {
        if (result.isConfirmed) {
            window.open('https://wa.me/237654027389', '_blank');
        } else if (result.isDenied) {
            window.location.href = "mailto:brandotatsa@gmail.com";
        }
    });
}

// --- CHARGEMENT DES ANALYSES ---
async function chargerAnalyse(type, titre) {
    try {
        let endpoint = `${API_BASE_URL}/donnees/`;
        
        // Mapping des endpoints selon votre routes.py
        switch(type) {
            case 'analyse-age': endpoint += `rapport-stats-globale`; break;
            case 'analyse-par-domaine': endpoint += `groupement-data`; break;
            case 'train_model': endpoint += `rapport-ml`; break;
            case 'analyse-grouper': endpoint += `analyse-grouper`; break;
            default: endpoint += `rapport-stats-globale`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        
        const data = await response.json();
        
        const overlay = document.getElementById('result-overlay');
        const title = document.getElementById('result-title');
        
        if (!overlay || !title) return;

        // Nettoyage des anciennes stats textuelles
        const oldStats = document.getElementById('stats-text');
        if (oldStats) oldStats.remove();

        overlay.style.display = 'flex';
        title.innerText = titre;

        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats-text';
        statsDiv.style.color = '#fff';
        statsDiv.style.marginBottom = '20px';

        let htmlContent = "";
        function parseData(obj, gap = '') {
            for (const [k, v] of Object.entries(obj)) {
                if (k.toLowerCase().includes('graphique')) continue;
                if (typeof v === 'object' && v !== null) {
                    htmlContent += `<p><strong>${gap}${k.replace(/_/g, ' ')} :</strong></p>`;
                    parseData(v, gap + '&nbsp;&nbsp;');
                } else {
                    htmlContent += `<p>${gap}${k.replace(/_/g, ' ')} : ${typeof v === 'number' ? v.toFixed(2) : v}</p>`;
                }
            }
        }
        
        parseData(data);
        statsDiv.innerHTML = htmlContent;
        title.after(statsDiv);

        renderChart(data);

    } catch (err) {
        Swal.fire('Erreur', 'Impossible de charger les données.', 'error');
    }
}

// --- GESTION DES ACCÈS ---
function verifierAcces() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin');
    const sectionAnalyses = document.getElementById('solutions');
    const lienNavAnalyses = document.getElementById('nav-analyses');

    if (isAdmin === "prof2026") { 
        if(sectionAnalyses) sectionAnalyses.style.display = 'block';
        if(lienNavAnalyses) lienNavAnalyses.style.display = 'block';
    }
}

function fermerModal() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.style.display = 'none';
}

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    type();
    verifierAcces();
});

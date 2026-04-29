// --- MACHINE À ÉCRIRE ---
const phrases = ["l'Informatique", "la Médecine", "l'Ingénierie", "votre Avenir"];
let i = 0, j = 0, isDel = false;

function type() {
    const text = document.getElementById('typewriter');
    if(!text) return;
    const curr = phrases[i];
    text.innerText = isDel ? curr.substring(0, j--) : curr.substring(0, j++);
    if (!isDel && j > curr.length) { isDel = true; setTimeout(type, 2000); }
    else if (isDel && j === 0) { isDel = false; i = (i + 1) % phrases.length; setTimeout(type, 500); }
    else setTimeout(type, isDel ? 50 : 150);
}

// Configuration de l'API - À modifier selon votre environnement
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000' 
    : 'https://tpinf232-yohr.onrender.com';

console.log("Tentative de connexion au backend", API_BASE_URL);

// --- FORMULAIRE ---
document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Bloquer les doublons (Sécurité simple par navigateur)
    if (localStorage.getItem('form_envoye')) {
        return Swal.fire('Attention', 'Vous avez déjà rempli ce formulaire.', 'warning');
    }

    const payload = {
        age: parseInt(document.getElementById('age').value),
        Sexe: document.getElementById('sexe').value,
        Domaine: document.getElementById('domaine').value,
        Frequence: parseInt(document.getElementById('frequence').value),
        Niveau_etude: document.getElementById('niveau_etude').value,
        Temps_moyen: "1h-2h" // Valeur par défaut
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
            document.getElementById('dataForm').reset();
        } else {
            const errorData = await response.json().catch(() => ({}));
            Swal.fire('Erreur', errorData.detail || 'Un problème est survenu lors de l\'envoi.', 'error');
        }
    } catch (err) {
        console.error('Erreur de connexion:', err);
        Swal.fire('Erreur Serveur', 'L\'API n\'est pas accessible. Vérifiez que le serveur est démarré.', 'error');
    }
});

let myChart = null;

function renderChart(data) {
    const canvas = document.getElementById('myChart');
    if (!canvas) {
        console.error('Canvas myChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (myChart) myChart.destroy();

    // Logique pour extraire les données selon le format
    let labels = [];
    let values = [];

    // Priorité aux données de fréquence par sexe
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
        // Fallback pour les autres types de groupements
        labels = Object.keys(data).filter(k => typeof data[k] !== 'object' && !k.includes('graphique') && !k.includes('Histogramme'));
        values = labels.map(k => data[k]);
    }

    // Vérifier qu'on a des données à afficher
    if (labels.length === 0 || values.length === 0) {
        console.warn('Aucune donnée graphique disponible');
        return;
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Répartition',
                data: values,
                backgroundColor: ['#38bdf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa'],
                borderWidth: 1
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// --- CONTACTS CORRIGÉS ---
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

// --- CHARGEMENT DES ANALYSES (Lien Backend-Chart.js) ---
async function chargerAnalyse(type, titre) {
    try {
        let endpoint = '';
        
        // Mapper les types d'analyse aux bons endpoints
        switch(type) {
            case 'analyse-age':
                endpoint = `${API_BASE_URL}/donnees/rapport-stats-globale`;
                break;
            case 'analyse-par-domaine':
                endpoint = `${API_BASE_URL}/donnees/groupement-data`;
                break;
            case 'train_model':
                endpoint = `${API_BASE_URL}/donnees/rapport-ml`;
                break;
            case 'analyse-grouper':
                endpoint = `${API_BASE_URL}/donnees/analyse-grouper`;
                break;
            default:
                endpoint = `${API_BASE_URL}/donnees/rapport-stats-globale`;
        }

        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erreur serveur (${response.status})`);
        }
        
        const data = await response.json();
        
        const overlay = document.getElementById('result-overlay');
        const title = document.getElementById('result-title');
        const container = document.querySelector('.modal-content');

        if (!overlay || !title || !container) {
            console.error('Éléments de la modale introuvables');
            return;
        }

        // Nettoyage des anciens textes de stats pour éviter l'accumulation
        const oldStats = document.getElementById('stats-text');
        if (oldStats) oldStats.remove();

        overlay.style.display = 'flex';
        title.innerText = titre;

        // --- AFFICHAGE DES DONNÉES TEXTUELLES ---
        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats-text';
        statsDiv.style.marginBottom = '20px';
        statsDiv.style.color = '#fff';
        statsDiv.style.maxHeight = '300px';
        statsDiv.style.overflowY = 'auto';

        let htmlContent = "";
        
        // Fonction récursive pour afficher les données imbriquées
        function afficherDonnees(obj, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                // Ne pas afficher les graphiques en texte
                if (key.toLowerCase().includes('graphique') || 
                    key.toLowerCase().includes('histogramme') || 
                    key.toLowerCase().includes('heatmap')) {
                    continue;
                }
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    htmlContent += `<p><strong>${prefix}${key.replace(/_/g, ' ')} :</strong></p>`;
                    afficherDonnees(value, '&nbsp;&nbsp;');
                } else if (typeof value === 'number') {
                    htmlContent += `<p>${prefix}<strong>${key.replace(/_/g, ' ')} :</strong> ${value.toFixed(2)}</p>`;
                } else if (typeof value !== 'object') {
                    htmlContent += `<p>${prefix}<strong>${key.replace(/_/g, ' ')} :</strong> ${value}</p>`;
                }
            }
        }
        
        afficherDonnees(data);
        statsDiv.innerHTML = htmlContent;
        
        // On insère les textes avant le canvas du graphique
        title.after(statsDiv);

        // --- AFFICHAGE DU GRAPHIQUE ---
        renderChart(data);

    } catch (err) {
        console.error('Erreur lors du chargement:', err);
        Swal.fire('Erreur', `Impossible de charger les statistiques: ${err.message}`, 'error');
    }
}

function verifierAcces() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin');

    const sectionAnalyses = document.getElementById('solutions');
    const lienNavAnalyses = document.getElementById('nav-analyses');

    // Si l'URL contient ?admin=prof2026
    if (isAdmin === "prof2026") { 
        if(sectionAnalyses) sectionAnalyses.style.display = 'block';
        if(lienNavAnalyses) lienNavAnalyses.style.display = 'block';
        console.log("Accès administrateur activé");
    } else {
        if(sectionAnalyses) sectionAnalyses.style.display = 'none';
        if(lienNavAnalyses) lienNavAnalyses.style.display = 'none';
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', ()=>{
    type();
    verifierAcces();
});

function fermerModal() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

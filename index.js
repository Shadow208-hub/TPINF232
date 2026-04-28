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
    : 'https://tpinf232-yohr.onrender.com'; // Remplacez par votre URL de production

// --- FORMULAIRE ---
const form = document.getElementById('dataForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloquer les doublons (Sécurité simple par navigateur)
        if (localStorage.getItem('form_envoye')) {
            return Swal.fire('Attention', 'Vous avez déjà rempli ce formulaire.', 'warning');
        }

        // Validation côté client
        const age = parseInt(document.getElementById('age').value);
        const frequence = parseInt(document.getElementById('frequence').value);
        
        if (isNaN(age) || age < 10 || age > 100) {
            return Swal.fire('Erreur', 'L\'âge doit être entre 10 et 100 ans.', 'error');
        }
        
        if (isNaN(frequence) || frequence < 1 || frequence > 30) {
            return Swal.fire('Erreur', 'La fréquence doit être entre 1 et 30.', 'error');
        }

        const payload = {
            age: age,
            Sexe: document.getElementById('sexe').value,
            Domaine: document.getElementById('domaine').value,
            Frequence: frequence,
            Niveau_etude: document.getElementById('niveau_etude').value,
            Temps_moyen: "1-5 min" // Valeur par défaut
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
                form.reset();
                // Réinitialiser l'affichage du range
                const labelFrequence = document.querySelector('#label-frequence strong');
                if (labelFrequence) labelFrequence.innerText = '15';
            } else {
                const errorData = await response.json().catch(() => ({}));
                Swal.fire('Erreur', errorData.detail || 'Un problème est survenu lors de l\'envoi.', 'error');
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            Swal.fire('Erreur Serveur', 'L\'API n\'est pas accessible. Vérifiez que le serveur est démarré.', 'error');
        }
    });
}

let myChart = null;

function renderChart(data) {
    const canvas = document.getElementById('myChart');
    if (!canvas) {
        console.error('Canvas myChart introuvable');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Détruire l'ancien graphique s'il existe
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }

    // Logique améliorée pour extraire les données selon le format
    let labels = [];
    let values = [];
    let chartType = 'bar';

    // CORRECTION: Gestion de tous les formats de données possibles
    if (data.frequence_par_sexe) {
        // Format de analyse-grouper
        labels = Object.keys(data.frequence_par_sexe);
        values = Object.values(data.frequence_par_sexe);
    } else if (data.Moyenne_par_domaine) {
        // Format de analyse-par-domaine
        labels = Object.keys(data.Moyenne_par_domaine);
        values = Object.values(data.Moyenne_par_domaine);
    } else if (data.General && data.General.frequence_sexe) {
        // Format de rapport-stats-globale (données imbriquées)
        labels = Object.keys(data.General.frequence_sexe);
        values = Object.values(data.General.frequence_sexe);
    } else if (data.frequence_sexe) {
        // Format simple
        labels = Object.keys(data.frequence_sexe);
        values = Object.values(data.frequence_sexe);
    } else if (data.model && data.model.R2_score !== undefined) {
        // Format ML - afficher les métriques
        labels = ['MSE', 'R2 Score'];
        values = [data.model.MSE || 0, data.model.R2_score || 0];
    } else {
        // Fallback : chercher les valeurs numériques
        const numericEntries = Object.entries(data).filter(([key, value]) => 
            typeof value === 'number' && 
            !key.toLowerCase().includes('graphique') && 
            !key.toLowerCase().includes('histogramme') &&
            !key.toLowerCase().includes('heatmap')
        );
        
        if (numericEntries.length > 0) {
            labels = numericEntries.map(([key]) => key.replace(/_/g, ' '));
            values = numericEntries.map(([, value]) => value);
        }
    }

    // Vérifier qu'on a des données à afficher
    if (labels.length === 0 || values.length === 0) {
        console.warn('Aucune donnée graphique disponible', data);
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';

    myChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Répartition',
                data: values,
                backgroundColor: ['#38bdf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa', '#fb923c'],
                borderWidth: 1,
                borderColor: '#1e293b'
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
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
        
        // CORRECTION: Mapper les types d'analyse aux bons endpoints
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

        // Afficher un loader pendant le chargement
        Swal.fire({
            title: 'Chargement...',
            text: 'Récupération des données en cours',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(endpoint);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Erreur serveur (${response.status})`);
        }
        
        const data = await response.json();
        
        // Fermer le loader
        Swal.close();
        
        const overlay = document.getElementById('result-overlay');
        const title = document.getElementById('result-title');
        const container = document.querySelector('.modal-content');

        if (!overlay || !title || !container) {
            console.error('Éléments de la modale introuvables');
            return;
        }

        // Nettoyage des anciens contenus
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
        statsDiv.style.padding = '10px';

        let htmlContent = "";
        
        // Fonction récursive améliorée pour afficher les données imbriquées
        function afficherDonnees(obj, prefix = '', level = 0) {
            if (level > 3) return; // Limite de profondeur pour éviter les boucles
            
            for (const [key, value] of Object.entries(obj)) {
                // Ne pas afficher les graphiques, images ou données base64
                if (key.toLowerCase().includes('graphique') || 
                    key.toLowerCase().includes('histogramme') || 
                    key.toLowerCase().includes('heatmap') ||
                    (typeof value === 'string' && value.length > 100)) {
                    continue;
                }
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    htmlContent += `<p style="margin-top: ${level * 10}px;"><strong style="color: #38bdf8;">${prefix}${key.replace(/_/g, ' ')} :</strong></p>`;
                    afficherDonnees(value, '&nbsp;&nbsp;', level + 1);
                } else if (Array.isArray(value)) {
                    htmlContent += `<p>${prefix}<strong style="color: #fbbf24;">${key.replace(/_/g, ' ')} :</strong> [${value.join(', ')}]</p>`;
                } else if (typeof value === 'number') {
                    const formattedValue = value % 1 === 0 ? value : value.toFixed(4);
                    htmlContent += `<p>${prefix}<strong style="color: #34d399;">${key.replace(/_/g, ' ')} :</strong> ${formattedValue}</p>`;
                } else if (typeof value !== 'object' && value !== null) {
                    htmlContent += `<p>${prefix}<strong>${key.replace(/_/g, ' ')} :</strong> ${value}</p>`;
                }
            }
        }
        
        afficherDonnees(data);
        
        if (htmlContent) {
            statsDiv.innerHTML = htmlContent;
            title.after(statsDiv);
        }

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
    // Nettoyer le graphique
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }
}

// Fermeture modale en cliquant en dehors
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('result-overlay');
    if (overlay && e.target === overlay) {
        fermerModal();
    }
});

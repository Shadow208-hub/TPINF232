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

// --- Configuration API (local ou Render) ---
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : 'https://tpinf232-yohr.onrender.com';

console.log("Connexion au backend :", API_BASE_URL);

// --- RAPPORT PDF dynamique (marche en local ET en prod) ---
function genererRapportPDF(event) {
    if (event) event.preventDefault();
    window.open(`${API_BASE_URL}/donnees/rapport-pdf/generate`, '_blank');
}

// --- CHART ---
let myChart = null;

function renderChart(data) {
    const canvas = document.getElementById('myChart');
    if (!canvas) { console.error('Canvas myChart introuvable'); return; }

    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();

    let labels = [];
    let values = [];

    if (data.General && data.General.frequence_sexe) {
        // /rapport-stats-globale
        labels = Object.keys(data.General.frequence_sexe);
        values = Object.values(data.General.frequence_sexe);
    } else if (data.frequence_par_sexe) {
        // /analyse-grouper
        labels = Object.keys(data.frequence_par_sexe);
        values = Object.values(data.frequence_par_sexe);
    } else if (data.Moyenne_par_domaine) {
        // /groupement-data
        labels = Object.keys(data.Moyenne_par_domaine);
        values = Object.values(data.Moyenne_par_domaine);
    } else if (data.model && data.model.coefficient) {
        // /rapport-ml : coefficients du modèle
        labels = ['age', 'Sexe', 'Domaine', 'Niveau_etude'];
        values = data.model.coefficient;
    } else {
        labels = Object.keys(data).filter(k =>
            typeof data[k] !== 'object' &&
            !k.toLowerCase().includes('graphique') &&
            !k.toLowerCase().includes('histogramme')
        );
        values = labels.map(k => data[k]);
    }

    if (labels.length === 0 || values.length === 0){
        const container = document.querySelector('.modal-content');
        if (container && !document.getElementById('no-data-msg')){
            const msg = document.createElement('p');
            msg.id = 'no-data-msg';
            msg.style.cssText = ' color:#fbbf24; text-align: center; margin-top:16px; font-size:1rem;';
            msg.innerText = "Aucune donnee disponible. soumettez d'abord des reponses via le formulaire.";
            container.appendChild(msg);
        }
        return ;
    }
    const noDataMsg = document.getElementById('no-data-msg');
    if (noDataMsg) noDataMsg.remove();
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Répartition',
                data: values,
                backgroundColor: ['#38bdf8', '#fbbf24', '#f87171', '#34d399', '#a78bfa'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// --- CONTACT ---
function choisirContact() {
    Swal.fire({
        title: 'Me contacter',
        showDenyButton: true,
        confirmButtonText: 'WhatsApp',
        denyButtonText: 'Email',
        confirmButtonColor: '#25D366',
        denyButtonColor: '#38bdf8'
    }).then((result) => {
        if (result.isConfirmed) window.open('https://wa.me/237654027389', '_blank');
        else if (result.isDenied) window.location.href = "mailto:brandotatsa@gmail.com";
    });
}

// --- CHARGEMENT DES ANALYSES ---
async function chargerAnalyse(type, titre) {
    try {
        let endpoint = '';
        switch (type) {
            case 'analyse-age':         endpoint = `${API_BASE_URL}/donnees/rapport-stats-globale`; break;
            case 'analyse-par-domaine': endpoint = `${API_BASE_URL}/donnees/groupement-data`;       break;
            case 'train_model':         endpoint = `${API_BASE_URL}/donnees/rapport-ml`;            break;
            case 'analyse-grouper':     endpoint = `${API_BASE_URL}/donnees/analyse-grouper`;       break;
            default:                    endpoint = `${API_BASE_URL}/donnees/rapport-stats-globale`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Erreur serveur (${response.status})`);
        }

        const data = await response.json();

        const overlay   = document.getElementById('result-overlay');
        const title     = document.getElementById('result-title');
        const container = document.querySelector('.modal-content');

        if (!overlay || !title || !container) {
            console.error('Éléments de la modale introuvables');
            return;
        }

        const oldStats = document.getElementById('stats-text');
        if (oldStats) oldStats.remove();
        const oldMsg = document.getElementById('no-data-msg');
        if (oldMsg) oldMsg.remove()

        overlay.style.display = 'flex';
        title.innerText = titre;

        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats-text';
        statsDiv.style.cssText = 'margin-bottom:20px; color:#fff; max-height:300px; overflow-y:auto;';

        let htmlContent = '';
        function afficherDonnees(obj, prefix = '') {
            for (const [key, value] of Object.entries(obj)) {
                if (['graphique','histogramme','heatmap'].some(k => key.toLowerCase().includes(k))) continue;
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
        title.after(statsDiv);

        renderChart(data);

    } catch (err) {
        console.error('Erreur lors du chargement:', err);
        Swal.fire('Erreur', `Impossible de charger les statistiques : ${err.message}`, 'error');
    }
}

// --- ACCÈS ADMIN ---
function verifierAcces() {
    const path   = window.location.pathname;
    const param  = new URLSearchParams(window.location.search).get('admin');
    const isAdmin= (path  === '/prof-admin-2026') || (param === 'prof2026');

    const sectionAnalyses = document.getElementById('solutions');
    const lienNavAnalyses = document.getElementById('nav-analyses');

    if (isAdmin) {
        if (sectionAnalyses) sectionAnalyses.style.display = 'block';
        if (lienNavAnalyses) lienNavAnalyses.style.display = 'inline-block';
        console.log("Accès administrateur activé");
    } else {
        if (sectionAnalyses) sectionAnalyses.style.display = 'none';
        if (lienNavAnalyses) lienNavAnalyses.style.display = 'none';
    }
}

// --- FERMER MODAL ---
function fermerModal() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ✅ CORRECTION 3 : Tout ce qui dépend du DOM est dans DOMContentLoaded
// → Le listener 'submit' ne plante plus si le script charge avant le HTML
document.addEventListener('DOMContentLoaded', () => {
    type();
    verifierAcces();

    const form = document.getElementById('dataForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (localStorage.getItem('form_envoye')) {
                return Swal.fire('Attention', 'Vous avez déjà rempli ce formulaire.', 'warning');
            }
            const ageVal = parseInt(document.getElementById('age').value);
            const freqVal = parseInt(document.getElementById('frequence').value);
            const payload = {
                age:          ageVal,
                Sexe:         document.getElementById('sexe').value,
                Domaine:      document.getElementById('domaine').value,
                Frequence:    freqVal,
                Niveau_etude: document.getElementById('niveau_etude').value,
                Temps_moyen:  "1-5 min",
                Type_utilisation: "etudes"
            };

            try {
                const response = await fetch(`${API_BASE_URL}/donnees/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json',
                             'Accept': 'application/json'},
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    Swal.fire('Succès !', 'Vos données ont été enregistrées avec succès.', 'success');
                    localStorage.setItem('form_envoye', 'true');
                    form.reset();
                    const label = document.querySelector('#label-frequence strong');
                    if (label) label.innerText = '15';
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    Swal.fire('Erreur', errorData.detail || "Un problème est survenu lors de l'envoi.", 'error');
                }
            } catch (err) {
                console.error('Erreur de connexion:', err);
                Swal.fire('Erreur Serveur', "L'API n'est pas accessible. Vérifiez que le serveur est démarré.", 'error');
            }
        });
    }
});

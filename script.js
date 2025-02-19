window.onload = function() {
    loadPage('home.html'); // Charge la page d'accueil sans recharger index.html
};


function loadPage(page) {
    fetch(page)
        .then(response => response.text()) // Récupère le contenu HTML du fichier
        .then(data => {
            document.getElementById("content").innerHTML = data; // Insère le contenu dans la page
        })
        .catch(error => console.error('Erreur de chargement :', error));
}


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



document.addEventListener("DOMContentLoaded", function () {
// let banner = document.getElementById("siteBanner");
    let accueil = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    if (accueil) {
        banner.src = "le site de gab.gif";
        banner.addEventListener("animationend", function () {
            banner.src = "le site de gab fin.gif";
        }, { once: true });
    } else {
        banner.src = "le site de gab fin.gif";
    }
});



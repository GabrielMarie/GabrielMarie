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
    let banner = document.getElementById("siteBanner");
    let accueil = window.location.pathname.includes("index.html") || window.location.pathname === "/";

    if (accueil) {
        let gifUrl = "le site de gab.gif?" + new Date().getTime();
        banner.src = gifUrl;

        // Attendre que le GIF soit bien chargé avant de programmer son remplacement
        banner.onload = function () {
            setTimeout(function () {
                let finalGifUrl = "le site de gab fin.gif?" + new Date().getTime();
                banner.src = finalGifUrl;
            }, 5000); // Remplace 5000 par la durée réelle du GIF
        };
    } else {
        let finalGifUrl = "le site de gab fin.gif?" + new Date().getTime();
        banner.src = finalGifUrl;
    }
});

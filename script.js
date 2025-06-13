


function loadPage(page) {
    fetch(page)
        .then(response => response.text()) // Récupère le contenu HTML du fichier
        .then(data => {
            document.getElementById("content").innerHTML = data; // Insère le contenu dans la page
        })
        
        .catch(error => console.error('Erreur de chargement :', error));
}

//animation de bannière
document.addEventListener("DOMContentLoaded", function () {
    let banner = document.getElementById("siteBanner");
    if (!banner) return;

    let path = window.location.pathname;
    let accueil = path === "/GabrielMarie/" || path === "/GabrielMarie";

    if (accueil) {
        banner.src = "le site de gab.gif";
        setTimeout(() => {
            banner.src = "le site de gab fin.gif";
        }, 6000);
    } else {
        banner.src = "le site de gab fin.gif";
    }
});



function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            document.querySelector('main').innerHTML = data;
            if (window.MathJax) {
                MathJax.typesetPromise();
            }
            
        })
        .catch(error => console.error('Erreur de chargement:', error));
}


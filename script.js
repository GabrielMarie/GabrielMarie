function loadPage(page) {
    fetch(page)
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
            if (window.MathJax) {
                MathJax.typesetPromise();
            }
        })
        .catch(error => {
            console.error('Erreur de chargement :', error);
            document.getElementById("content").innerHTML = "<p>Erreur de chargement de la page.</p>";
        });
}

document.addEventListener("DOMContentLoaded", () => {
    let hash = window.location.hash.slice(1);
    let page = (hash && hash.endsWith(".html")) ? hash : "home.html";
    loadPage(page);
});

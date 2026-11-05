THE LOCK CORNER

Copier Lock dans le dossier publie par GitHub Pages.
Ouvrir index.html pour verifier le site localement.

Ajouter un article :
1. Dupliquer article/welcome.html et modifier son contenu.
2. Ajouter son titre, sa date YYYY-MM-DD, sa description,
   ses mots-cles et son chemin dans articles.js.

La recherche porte sur les titres, descriptions et mots-cles.
La liste et la recherche necessitent JavaScript.
La police Google Fonts necessite Internet (sinon monospace).

Contact : adresse configuree. URL LinkedIn a fournir.
Le dossier Lock ne constitue pas une protection d'acces.


THE LOCK CORNER — GUIDE POUR MODIFIER LE SITE
============================================

Ce document sert de consigne à une IA pour créer des articles
et les intégrer au site, même sans connaître les conversations
précédentes.


1. OBJECTIF ET LANGUE
--------------------

Le site présente mes notes et recherches en sécurité physique.

Titre du site :
The Lock Corner

Sous-titre :
Notes and research on physical security.

Tout le contenu visible sur le site doit être en anglais,
sauf demande explicite contraire.

Les articles doivent être concis, naturels et fidèles aux
informations fournies. Ne pas inventer des résultats, des
fonctionnalités ou des affirmations techniques.


2. STRUCTURE DU SITE
--------------------

Lock/
    index.html
    contact.html
    search.html
    style.css
    articles.js
    app.js
    README.txt
    article/
        welcome.html
        key-decoder.html
        autres-articles.html

Attention :
- Le dossier principal s'appelle Lock, avec un L majuscule.
- Le dossier des articles s'appelle article, au singulier.
- Certains articles de cet exemple peuvent ne pas encore exister.
- Vérifier les fichiers réels avant de les modifier.


3. FICHIERS À CONSULTER AVANT DE COMMENCER
----------------------------------------

Pour créer et intégrer un nouvel article, consulter :

- articles.js : format exact de la liste des articles.
- Un article HTML existant : modèle de structure.
- style.css : classes CSS et style actuels.
- app.js seulement si le fonctionnement de la recherche
  ou de la liste doit être modifié.

Si ces fichiers ne sont pas disponibles, demander à
l'utilisateur de fournir le dossier Lock ou les fichiers
nécessaires.

Ne pas prétendre avoir intégré un article dans un dépôt
si seuls des blocs de code ont été fournis.


4. STYLE VISUEL ET LISIBILITÉ DU CODE
-----------------------------------

Conserver le style existant :

- Fond presque noir : #111.
- Texte blanc.
- Police : Press Start 2P, avec monospace en remplacement.
- Bordures carrées.
- Apparence sobre et pixelisée.
- Pas de bibliothèque ni de framework supplémentaire.

Réutiliser ../style.css depuis les pages du dossier article.

Le code doit rester facile à lire et à modifier :

- Indentation cohérente de 4 espaces.
- Sauts de ligne entre les sections.
- Pas de HTML, CSS ou JavaScript compressé sur une ligne.
- Paragraphes longs répartis sur plusieurs lignes dans le code.
- Commentaires seulement lorsqu'ils sont utiles.

Les liens externes placés dans les articles doivent être
bleu ciel : #87ceeb.

Utiliser une classe dédiée, par exemple .external-link,
sans changer les couleurs de toute la navigation.

Si nécessaire, ajouter une seule fois dans style.css :

.external-link {
    color: #87ceeb;
    text-underline-offset: 5px;
}

.external-link:hover {
    color: #111;
    background: #87ceeb;
}

Si une classe équivalente existe déjà, la réutiliser.


5. CRÉER UN NOUVEL ARTICLE HTML
------------------------------

Créer un fichier dans :

Lock/article/nom-de-l-article.html

Utiliser un nom court, en minuscules, sans espaces
ni accents, avec des tirets entre les mots.

Partir d'un article existant et conserver :

- <!doctype html>
- <html lang="en">
- L'encodage UTF-8.
- La balise viewport.
- Le lien vers ../style.css.
- L'en-tête et la navigation.
- Le lien discret vers https://gabrielmarie.ca.
- Le lien de retour vers ../index.html.
- Le contenu dans <main>, puis <article>.

Modifier :

- Le <title> :
  Titre de l'article | The Lock Corner
- Le titre visible dans <h1>.
- La date visible.
- L'attribut datetime de <time>.
- Le contenu de l'article.

Exemple de date :

<time datetime="2026-11-05">2026-11-05</time>

Utiliser la date de publication indiquée par l'utilisateur.
Si aucune date n'est donnée, utiliser la date du jour si elle
est connue. Sinon, demander la date.

Ne pas recopier automatiquement la date de l'article modèle.


6. CHEMINS À UTILISER DANS UN ARTICLE
------------------------------------

Depuis Lock/article/nom-de-l-article.html :

Feuille de style :
../style.css

Liste des articles :
../index.html

Contact :
../contact.html

Recherche :
../search.html

Site principal :
https://gabrielmarie.ca

Les chemins relatifs sont importants.
Ne pas utiliser /style.css ou /index.html : cela pourrait
pointer vers la racine du domaine plutôt que vers Lock.


7. AJOUTER L'ARTICLE À articles.js
---------------------------------

Créer le fichier HTML ne suffit pas.

Ajouter également un objet au tableau existant
window.LOCK_ARTICLES dans Lock/articles.js.

Exemple d'objet :

{
    title: "Make Your Own Key Decoder",
    date: "2026-11-05",
    description: "A project to make creating your own key decoder easier.",
    keywords: ["key decoder", "physical security", "research"],
    url: "article/key-decoder.html"
}

Règles :

- Conserver toutes les entrées existantes.
- Ajouter une virgule entre les objets.
- Ne pas ajouter deux fois le même article.
- Utiliser le format de date YYYY-MM-DD.
- Faire correspondre la date avec celle du HTML.
- Faire correspondre le titre avec celui de l'article.
- Écrire une description courte en anglais.
- Ajouter des mots-clés pertinents.
- Utiliser un chemin relatif au dossier Lock.
- Respecter exactement le nom du fichier et sa casse.

Le chemin dans articles.js doit donc être :

article/key-decoder.html

et non :

Lock/article/key-decoder.html

ni :

../article/key-decoder.html

Le tri du plus récent au plus ancien est effectué
automatiquement par app.js.

Il n'est normalement pas nécessaire de modifier index.html
ou search.html pour ajouter un article.


8. RECHERCHE
------------

La recherche utilise les informations de articles.js :

- title
- description
- keywords

Elle ne lit pas le texte complet des articles HTML.

Choisir des mots-clés qui permettront de retrouver
facilement l'article.

La liste et la recherche nécessitent JavaScript.


9. CONTACT ET IDENTITÉ
---------------------

Adresse de contact :

Gabriel.saint.gelais+lock@gmail.com

Texte de contact :

I'm open to research collaborations and providing security
recommendations.

Ne pas modifier ces informations sans demande.

Ne pas inventer d'adresse LinkedIn.
Si le lien n'est pas déjà présent dans les fichiers,
demander son URL à l'utilisateur.


10. VÉRIFICATIONS AVANT DE LIVRER
--------------------------------

Vérifier que :

[ ] Le nouvel article HTML existe dans article/.
[ ] Son entrée existe une seule fois dans articles.js.
[ ] Le chemin de cette entrée correspond au fichier créé.
[ ] Le titre et la date correspondent dans les deux fichiers.
[ ] Le JavaScript reste syntaxiquement valide.
[ ] Toutes les anciennes entrées sont conservées.
[ ] Les liens relatifs sont corrects.
[ ] Les liens externes de l'article sont bleu ciel.
[ ] Le code est indenté et comporte des sauts de ligne.
[ ] Aucun contenu provisoire du modèle n'a été oublié.

Si un navigateur de test est disponible, vérifier aussi :

[ ] L'article apparaît dans la liste.
[ ] Son lien ouvre la bonne page.
[ ] La recherche le retrouve avec un mot-clé.
[ ] Le retour à la liste fonctionne.
[ ] Le style s'affiche correctement sur mobile.

Ne pas déclarer avoir effectué un test qui n'a pas été fait.


11. LIVRAISON ATTENDUE DE L'IA
------------------------------

Si l'IA peut modifier les fichiers fournis :

- Créer l'article.
- Mettre à jour articles.js sans supprimer les autres articles.
- Modifier style.css uniquement si nécessaire.
- Fournir les fichiers modifiés ou une archive qui conserve
  la structure Lock/.
- Résumer brièvement les modifications.

Si l'IA ne peut fournir que du texte :

- Donner le HTML complet de l'article.
- Indiquer son emplacement exact.
- Donner l'objet à ajouter à articles.js.
- Expliquer où l'insérer sans remplacer les autres entrées.
- Fournir le CSS à ajouter seulement s'il est nécessaire.

Ne pas remplacer articles.js par une version contenant
uniquement le nouvel article.


12. PUBLICATION ET CONFIDENTIALITÉ
----------------------------------

Le site est statique et ne nécessite pas de compilation.

La publication dépend de la configuration GitHub Pages
du dépôt. Conserver l'emplacement déjà utilisé par le site.

Le nom Lock ne protège pas l'accès au contenu.
Ne pas y placer de mots de passe ni de données privées.

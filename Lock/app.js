(() => {
    "use strict";

    const list = document.getElementById("articles");
    const input = document.getElementById("query");
    const status = document.getElementById("status");
    const form = document.getElementById("search-form");
    const articles = [...(window.LOCK_ARTICLES || [])];

    articles.sort((a, b) => b.date.localeCompare(a.date));

    function normalize(value) {
        return String(value)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function render(query = "") {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        const matches = articles.filter(article => {
            const text = normalize([
                article.title,
                article.description,
                article.label || "",
                ...(article.keywords || [])
            ].join(" "));

            return terms.every(term => text.includes(term));
        });

        list.replaceChildren();

        for (const article of matches) {
            const item = document.createElement("li");
            const date = document.createElement("time");
            const title = document.createElement("h2");
            const link = document.createElement("a");
            const description = document.createElement("p");
            const keywords = document.createElement("p");

            date.dateTime = article.date;
            date.textContent = article.date;
            link.href = article.url;
            link.textContent = article.title;
            description.textContent = article.description;
            keywords.className = "keywords";
            keywords.textContent = (article.keywords || []).join(" / ");

            title.append(link);
            item.append(date, title, description, keywords);
            if (article.label) {
                const label = document.createElement("p");
                label.className = "article-label";
                label.textContent = article.label;
                item.append(label);
            }

            list.append(item);
        }

        if (!matches.length) {
            const item = document.createElement("li");
            item.textContent = "No articles found.";
            list.append(item);
        }

        if (status) {
            const suffix = matches.length === 1 ? "" : "s";
            status.textContent = `${matches.length} article${suffix} found.`;
        }
    }

    if (input) {
        input.value = new URLSearchParams(location.search).get("q") || "";
        input.addEventListener("input", () => render(input.value));

        form.addEventListener("submit", event => {
            event.preventDefault();
            const url = new URL(location.href);

            if (input.value.trim()) {
                url.searchParams.set("q", input.value.trim());
            } else {
                url.searchParams.delete("q");
            }

            history.replaceState(null, "", url);
            render(input.value);
        });
    }

    render(input ? input.value : "");
})();

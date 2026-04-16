let perfumes = []; // Globaler Speicher für die Parfüm-Daten

// ===== 1. INITIALISIERUNG & DATEN LADEN =====

/**
 * Lädt die Parfümdaten aus der JSON-Datei und initialisiert die Seite
 */
async function loadPerfumes() {
    try {
        const response = await fetch("resources/perfumes.json");
        perfumes = await response.json();
        
        createFilters(perfumes); // Dynamische Filter erstellen
        render(perfumes);        // Initiale Anzeige aller Parfüms
    } catch (error) {
        console.error("Fehler beim Laden der Parfüm-Daten:", error);
    }
}

// Startet die App, sobald das DOM geladen ist
document.addEventListener("DOMContentLoaded", loadPerfumes);

// ===== 2. NAVIGATION & UI-STEUERUNG =====

/**
 * Wechselt zwischen den Hauptseiten (Startseite/Finder)
 */
function showPage(pageId) {
    const pages = ["home", "finder"];
    pages.forEach(id => {
        document.getElementById(id).style.display = (id === pageId) ? "block" : "none";
    });
}

/**
 * Scrollt sanft zum Seitenanfang
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Steuert die Sichtbarkeit des "Nach oben"-Buttons beim Scrollen
 */
window.onscroll = function() {
    const btn = document.getElementById("back-to-top");
    if (btn) {
        const isScrollingDown = document.body.scrollTop > 300 || document.documentElement.scrollTop > 300;
        btn.style.display = isScrollingDown ? "block" : "none";
    }
};

// ===== 3. RENDER-LOGIK (ANZEIGE) =====

/**
 * Erzeugt die Parfüm-Kacheln und aktualisiert den Counter
 */
function render(list) {
    const container = document.getElementById("results");
    const counter = document.getElementById("counter");

    // Counter aktualisieren
    if (counter) {
        counter.innerText = `Zeige ${list.length} von ${perfumes.length} Düften`;
    }
    
    if (!list.length) {
        container.innerHTML = "<p>Kein Duft gefunden, der deinen Kriterien entspricht.</p>";
        return;
    }
    
    // Numerische Sortierung nach Parfüm-Nummer
    const sortedList = [...list].sort((a, b) => 
        a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );

    // HTML-Kacheln generieren
    container.innerHTML = sortedList.map(p => {
        const links = p.sizes.map((s, i) =>
            `<a href="${p.links[i] || '#'}">Zum Produkt: ${s} (${p.prices[i] || ''})</a>`
        ).join("<br>");

        return `
            <div class="card">
                <button class="details-btn-top" onclick="showDetails('${p.number}')">Details</button>
                <h3>${p.number} ${p.name}</h3>
                <p>${p.description}</p>
                <div class="tags">
                    ${p.olfactory_group.map(t => `<span>${t}</span>`).join("")}
                </div>
                <div class="product-links">${links}</div>
            </div>
        `;
    }).join("");
}

// ===== 4. MODAL-STEUERUNG (DETAILS) =====

/**
 * Öffnet das Modal und füllt es mit der Duftpyramide
 */
function showDetails(number) {
    const p = perfumes.find(item => item.number === number);
    if (!p) return;

    const modal = document.getElementById("perfume-modal");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
        <h2 style="color: #1a1a1a; text-decoration: underline;">${p.number} ${p.name}</h2>
        <h3>Duftpyramide</h3>
        <div class="pyramid-section">
            <h4>Kopfnote</h4>
            <p>${p.pyramid.top.join(", ")}</p>
        </div>
        <div class="pyramid-section">
            <h4>Herznote</h4>
            <p>${p.pyramid.heart.join(", ")}</p>
        </div>
        <div class="pyramid-section">
            <h4>Basisnote</h4>
            <p>${p.pyramid.base.join(", ")}</p>
        </div>
    `;
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("perfume-modal").style.display = "none";
}

// Schließen des Modals bei Klick außerhalb des Inhalts
window.addEventListener("click", (event) => {
    const modal = document.getElementById("perfume-modal");
    if (event.target === modal) closeModal();
});

// ===== 5. FILTER- & SUCH-LOGIK =====

/**
 * Erstellt dynamisch die Checkboxen basierend auf den vorhandenen Daten
 */
function createFilters(list) {
    const createInput = (val, group) => `
        <label><input type="checkbox" value="${val}" data-group="${group}" onchange="filter()"> ${val}</label>
    `;

    // Daten extrahieren und sortieren
    const sexes = [...new Set(list.map(p => p.sex))];
    const groups = [...new Set(list.flatMap(p => p.olfactory_group))].sort();
    const sizes = [...new Set(list.flatMap(p => p.sizes))].sort((a, b) => {
        const numA = parseInt(a.match(/\d+/) || 0);
        const numB = parseInt(b.match(/\d+/) || 0);
        return numA - numB;
    });

    // In die Container schreiben
    document.getElementById("filter-sex").innerHTML = sexes.map(s => createInput(s, "sex")).join("");
    document.getElementById("filter-group").innerHTML = groups.map(g => createInput(g, "group")).join("");
    document.getElementById("filter-size").innerHTML = sizes.map(s => createInput(s, "size")).join("");
}

/**
 * Haupt-Filterfunktion: Kombiniert Suche und Checkboxen
 */
function filter() {
    const inputField = document.getElementById("search-input");
    const clearBtn = document.getElementById("clear-search");
    const searchTerm = inputField.value.toLowerCase();

    // X-Button anzeigen/verstecken
    if (clearBtn) clearBtn.style.display = searchTerm.length > 0 ? "block" : "none";

    // Gewählte Filter einsammeln
    const selected = { sex: [], group: [], size: [] };
    document.querySelectorAll("input[type=checkbox]:checked").forEach(i => {
        selected[i.dataset.group].push(i.value);
    });

    // Filtern der Liste
    const filtered = perfumes.filter(p => {
        const searchMatch = p.name.toLowerCase().includes(searchTerm) || p.number.toLowerCase().includes(searchTerm);
        const sexMatch = !selected.sex.length || selected.sex.includes(p.sex);
        const groupMatch = !selected.group.length || selected.group.some(g => p.olfactory_group.includes(g));
        const sizeMatch = !selected.size.length || selected.size.some(s => p.sizes.includes(s));

        return searchMatch && sexMatch && groupMatch && sizeMatch;
    });

    render(filtered);
    updateDisabledOptions(filtered);
}

/**
 * Deaktiviert Checkboxen, die zu keinem Ergebnis führen würden
 */
function updateDisabledOptions(filtered) {
    document.querySelectorAll("input[type=checkbox]").forEach(input => {
        const group = input.dataset.group;
        const isPossible = filtered.some(p => {
            if (group === "sex") return p.sex === input.value;
            if (group === "group") return p.olfactory_group.includes(input.value);
            if (group === "size") return p.sizes.includes(input.value);
        });
        input.disabled = !isPossible && !input.checked;
    });
}

/**
 * Setzt alle Filter und das Suchfeld zurück
 */
function resetFilter() {
    document.getElementById("search-input").value = "";
    document.querySelectorAll("input[type=checkbox]").forEach(i => {
        i.checked = false;
        i.disabled = false;
    });
    filter();
}

/**
 * Leert nur das Suchfeld
 */
function clearSearchInput() {
    const input = document.getElementById("search-input");
    input.value = "";
    filter();
    input.focus();
}

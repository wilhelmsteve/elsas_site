let perfumes = [];// global

// ===== 1. INITIALISIERUNG & DATEN LADEN =====

/**
 * Lädt die Parfümdaten und initialisiert den Startzustand
 */
async function loadPerfumes() {
    try {
        const response = await fetch("resources/perfumes.json");
        perfumes = await response.json();
        
        // Hinweis: Aktuell nutzen wir die Variable 'perfumes' aus dem globalen Scope
        createFilters(perfumes); 
        render(perfumes);        
    } catch (error) {
        console.error("Fehler beim Laden der Parfüm-Daten:", error);
    }
}

// Start-Ereignis
document.addEventListener("DOMContentLoaded", () => {
    loadPerfumes();
    showPage('home'); // Standardmäßig die Startseite zeigen
});

// ===== 2. NAVIGATION & UI-STEUERUNG =====

/**
 * Wechselt zwischen den Sektionen der Webseite
 * @param {string} pageId - Die ID der anzuzeigenden Section
 */
function showPage(pageId) {
    const pages = ["home", "finder", "lifestyle", "partner", "faq"];
    
    // 1. Sichtbarkeit der Seiten umschalten
    pages.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = (id === pageId) ? "block" : "none";
        }
    });

    // 2. Aktiven Navigations-Link hervorheben
    const navButtons = document.querySelectorAll(".nav-links button");
    navButtons.forEach(btn => {
        // Klasse entfernen
        btn.classList.remove("active-link");
        // Klasse hinzufügen, wenn das onclick-Attribut die pageId enthält
        if (btn.getAttribute("onclick").includes(`'${pageId}'`)) {
            btn.classList.add("active-link");
        }
    });

    // 3. Mobiles Menü nach Auswahl einklappen
    const navLinks = document.getElementById("nav-links");
    if (navLinks) navLinks.classList.remove("active");
    
    // 4. Komfort: Zurück nach oben springen
    window.scrollTo(0, 0);
}

/**
 * Öffnet/Schließt das Burger-Menü auf Mobilgeräten
 */
function toggleMenu() {
    const nav = document.getElementById("nav-links");
    if (nav) nav.classList.toggle("active");
}

/**
 * Steuert den "Nach oben"-Button (Scroll-Event)
 */
window.onscroll = function() {
    const btn = document.getElementById("back-to-top");
    if (btn) {
        const isVisible = document.body.scrollTop > 300 || document.documentElement.scrollTop > 300;
        btn.style.display = isVisible ? "block" : "none";
    }
};

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 3. RENDER-LOGIK (FINDER) =====

/**
 * Zeichnet die Parfüm-Karten basierend auf der gefilterten Liste
 */
function render(list) {
    const container = document.getElementById("results");
    const counter = document.getElementById("counter");

    if (counter) {
        counter.innerText = `Zeige ${list.length} von ${perfumes.length} Düften`;
    }
    
    if (!list || list.length === 0) {
        container.innerHTML = "<p class='card'>Kein Duft gefunden, der deinen Kriterien entspricht.</p>";
        return;
    }
    
    // Sortierung: Numerisch nach Parfüm-Nummer (z.B. 61, 62, 74)
    const sortedList = [...list].sort((a, b) => 
        a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
    );

    container.innerHTML = sortedList.map(p => {
        const productLinks = p.sizes.map((s, i) =>
            `<a href="${p.links[i] || '#'}" target="_blank">Zum Produkt: ${s} (${p.prices[i] || ''})</a>`
        ).join("<br>");

        return `
            <div class="card">
                <button class="details-btn-top" onclick="showDetails('${p.number}')">Details</button>
                <h3>${p.number} ${p.name}</h3>
                <p>${p.description}</p>
                <div class="tags">
                    ${p.olfactory_group.map(t => `<span>${t}</span>`).join("")}
                </div>
                <div class="product-links">${productLinks}</div>
            </div>
        `;
    }).join("");
}

// ===== 4. MODAL & DETAILS =====

/**
 * Zeigt die Duftpyramide im Modal an
 */
function showDetails(number) {
    const p = perfumes.find(item => item.number === number);
    if (!p) return;

    const modal = document.getElementById("perfume-modal");
    const body = document.getElementById("modal-body");

    // Fallback falls Pyramidendaten fehlen
    const top = p.pyramid?.top?.join(", ") || "Nicht angegeben";
    const heart = p.pyramid?.heart?.join(", ") || "Nicht angegeben";
    const base = p.pyramid?.base?.join(", ") || "Nicht angegeben";

    body.innerHTML = `
        <h2 style="color: var(--color-dark); text-decoration: underline;">${p.number} ${p.name}</h2>
        <h3>Duftpyramide</h3>
        <div class="pyramid-section">
            <h4>Kopfnote</h4><p>${top}</p>
        </div>
        <div class="pyramid-section">
            <h4>Herznote</h4><p>${heart}</p>
        </div>
        <div class="pyramid-section">
            <h4>Basisnote</h4><p>${base}</p>
        </div>
    `;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("perfume-modal").style.display = "none";
    document.body.style.overflow = "auto";
}

// Schließen bei Klick außerhalb des Modal-Fensters
window.addEventListener("click", (e) => {
    const modal = document.getElementById("perfume-modal");
    if (e.target === modal) closeModal();
});

// ===== 5. FILTER-SYSTEM =====

/**
 * Erstellt die Filter-Checkboxen dynamisch aus den Parfüm-Daten
 */
function createFilters(list) {
    const sexCont = document.getElementById("filter-sex");
    const groupCont = document.getElementById("filter-group");
    const sizeCont = document.getElementById("filter-size");
    const classCont = document.getElementById("filter-class");

    const sexes = [...new Set(list.map(p => p.sex))];
    const groups = [...new Set(list.flatMap(p => p.olfactory_group))].sort();
    const sizes = [...new Set(list.flatMap(p => p.sizes))].sort((a, b) => {
        return parseInt(a) - parseInt(b);
    });
    const classes = [...new Set(list.flatMap(p => p.classes))].sort();

    const buildHTML = (val, group) => `
        <label><input type="checkbox" value="${val}" data-group="${group}" onchange="filter()"> ${val}</label>
    `;

    if (sexCont) sexCont.innerHTML = sexes.map(s => buildHTML(s, "sex")).join("");
    if (groupCont) groupCont.innerHTML = groups.map(g => buildHTML(g, "group")).join("");
    if (sizeCont) sizeCont.innerHTML = sizes.map(s => buildHTML(s, "size")).join("");
    if (classCont) classCont.innerHTML = classes.map(c => buildHTML(c, "class")).join("");
}

/**
 * Filtert die Liste nach Sucheingabe und Checkboxen
 */
function filter() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const clearBtn = document.getElementById("clear-search");
    
    if (clearBtn) clearBtn.style.display = searchTerm.length > 0 ? "block" : "none";

    // Aktive Filter sammeln
    const selected = { sex: [], group: [], size: [], class: [] };
    document.querySelectorAll("input[type=checkbox]:checked").forEach(cb => {
        selected[cb.dataset.group].push(cb.value);
    });

    const filtered = perfumes.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.number.toLowerCase().includes(searchTerm);
        const matchesSex = !selected.sex.length || selected.sex.includes(p.sex);
        const matchesGroup = !selected.group.length || selected.group.some(g => p.olfactory_group.includes(g));
        const matchesSize = !selected.size.length || selected.size.some(s => p.sizes.includes(s));
        const matchesClass = !selected.class.length || selected.class.some(c => p.classes.includes(c));

        return matchesSearch && matchesSex && matchesGroup && matchesSize && matchesClass;
    });

    render(filtered);
    updateDisabledOptions(filtered);
}

/**
 * Graut Filter aus, die in der aktuellen Auswahl keine Treffer mehr erzielen würden
 */
function updateDisabledOptions(filteredList) {
    document.querySelectorAll("input[type=checkbox]").forEach(cb => {
        const group = cb.dataset.group;
        const isPossible = filteredList.some(p => {
            if (group === "sex") return p.sex === cb.value;
            if (group === "group") return p.olfactory_group.includes(cb.value);
            if (group === "size") return p.sizes.includes(cb.value);
            if (group === "class") return p.classes.includes(cb.value);

            return false;
        });
        cb.disabled = !isPossible && !cb.checked;
    });
}

/**
 * Alles zurücksetzen
 */
function resetFilter() {
    document.getElementById("search-input").value = "";
    document.querySelectorAll("input[type=checkbox]").forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    filter();
}

function clearSearchInput() {
    const input = document.getElementById("search-input");
    input.value = "";
    filter();
    input.focus();
}

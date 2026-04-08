let perfumes = [];// global

// JSON LADEN
async function loadPerfumes() {
  try {
    const response = await fetch("/resources/perfumes.json");
    perfumes = await response.json();
    render(perfumes);
  } catch (error) {
    console.error("Fehler beim Laden der Parfums:", error);
  }
}

// NAVIGATION
function showPage(page) {
  document.getElementById("home").style.display = "none";
  document.getElementById("finder").style.display = "none";
  document.getElementById(page).style.display = "block";
}

// RENDER
function render(list) {
  const container = document.getElementById("results");

  if (!list.length) {
    container.innerHTML = "<p>Kein Duft gefunden</p>";
    return;
  }

  container.innerHTML = list.map(p => {
    const links = p.sizes.map((s,i) =>
      `<a href="${p.links[i] || '#'}">Produkt (${s}) ${p.prices[i] || ''}</a><br>`
    ).join("");

    return `
      <div class="card">
        <h3>${p.number} ${p.name}</h3>
        <p>${p.description}</p>
        <div class="tags">
          ${p.olfactory_group.map(t => `<span>${t}</span>`).join("")}
        </div>
        <br>${links}
      </div>
    `;
  }).join("");
}

// FILTER
function filter() {
  const inputs = document.querySelectorAll("input[type=checkbox]");

  const selected = {
    sex: [],
    group: []
  };

  inputs.forEach(i => {
    if (i.checked) {
      selected[i.dataset.group].push(i.value);
    }
  });

  const filtered = perfumes.filter(p => {
    const sexMatch = selected.sex.length === 0 || selected.sex.includes(p.sex);
    const groupMatch = selected.group.length === 0 ||
      selected.group.some(g => p.olfactory_group.includes(g));

    return sexMatch && groupMatch;
  });

  render(filtered);
  updateDisabledOptions(filtered);
}

// DISABLE LOGIK
function updateDisabledOptions(filtered) {
  const inputs = document.querySelectorAll("input[type=checkbox]");

  inputs.forEach(input => {
    const group = input.dataset.group;

    const possible = filtered.some(p => {
      if (group === "sex") return p.sex === input.value;
      if (group === "group") return p.olfactory_group.includes(input.value);
    });

    input.disabled = !possible && !input.checked;
  });
}

// RESET
function resetFilter() {
  document.querySelectorAll("input").forEach(i => {
    i.checked = false;
    i.disabled = false;
  });
  render(perfumes);
}

// START
document.addEventListener("DOMContentLoaded", () => {
  loadPerfumes();
});
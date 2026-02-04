const API_URL = "http://localhost:3000";

const showAlert = (msg, type = "success") => {
    const container = document.getElementById("alert-container");
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${msg}
            <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
        </div>`;
    setTimeout(() => container.innerHTML = "", 3000);
};

async function fetchJson(url, options = {}) {
    const res = await fetch(`${API_URL}${url}`, options);
    return res.json();
}

// --- PÁGINA INICIAL ---
if (document.getElementById("pizza-form")) {
    (async () => {
        const data = await fetchJson("/ingredientes");

        const fill = (id, list) => {
            const select = document.getElementById(id);
            list.forEach(i => select.innerHTML += `<option value="${i.id}">${i.tipo}</option>`);
        };
        fill("borda", data.bordas);
        fill("massa", data.massas);

        // Renderizar Checkboxes
        const container = document.getElementById("sabores-container");
        data.sabores.forEach(s => {
            container.innerHTML += `
                <div class="col-md-6 col-12">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" name="sabores" value="${s.id}" id="sabor-${s.id}">
                        <label class="form-check-label" for="sabor-${s.id}">${s.nome}</label>
                    </div>
                </div>`;
        });

        document.getElementById("pizza-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const checked = document.querySelectorAll('input[name="sabores"]:checked');
            const sabores = Array.from(checked).map(c => c.value);

            if (sabores.length > 3) return showAlert("Máximo 3 sabores!", "warning");
            if (sabores.length === 0) return showAlert("Selecione pelo menos 1 sabor!", "warning");

            const body = JSON.stringify({
                borda: document.getElementById("borda").value,
                massa: document.getElementById("massa").value,
                sabores
            });

            await fetchJson("/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body });
            showAlert("Pedido realizado com sucesso!");
            e.target.reset();
        });
    })();
}

// --- DASHBOARD ---
if (document.getElementById("orders-table-body")) {
    (async () => {
        const tbody = document.getElementById("orders-table-body");

        const renderTable = async () => {
            const statusList = await fetchJson("/status");
            const pedidos = await fetchJson("/pedidos");
            tbody.innerHTML = "";

            pedidos.forEach(p => {
                const options = statusList.map(s =>
                    `<option value="${s.id}" ${s.tipo === p.status ? "selected" : ""}>${s.tipo}</option>`
                ).join("");

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.id}</td>
                    <td>${p.borda}</td>
                    <td>${p.massa}</td>
                    <td><ul>${p.sabores.map(s => `<li>${s}</li>`).join("")}</ul></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <select class="form-control status-select" id="status-${p.id}">${options}</select>
                            <button class="update-btn" data-id="${p.id}"><i class="fas fa-sync-alt"></i></button>
                        </div>
                    </td>
                    <td>
                        <button class="delete-btn" data-id="${p.id}"><i class="fas fa-times"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        tbody.addEventListener("click", async (e) => {
            const btnUpd = e.target.closest(".update-btn");
            const btnDel = e.target.closest(".delete-btn");

            if (btnUpd) {
                const id = btnUpd.dataset.id;
                const status = document.getElementById(`status-${id}`).value;
                await fetchJson(`/pedidos/${id}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status })
                });
                showAlert("Status atualizado!");
            }
            if (btnDel) {
                await fetchJson(`/pedidos/${btnDel.dataset.id}`, { method: "DELETE" });
                renderTable();
            }
        });

        renderTable();
    })();
}

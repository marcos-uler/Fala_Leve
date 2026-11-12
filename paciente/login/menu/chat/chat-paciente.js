(() => {
    "use strict";
    let patient;
    try { patient = JSON.parse(localStorage.getItem("paciente") || "null"); }
    catch { patient = null; }
    const params = new URLSearchParams(location.search);
    const patientId = params.get("patientId") || patient?.id_paciente;
    const psychologistId = params.get("psychologistId");
    if (!patient?.id_paciente || !patientId || String(patient.id_paciente) !== String(patientId) || !psychologistId) {
        location.replace("../../entrar.html");
        return;
    }

    const isDemo = Boolean(patient.modo_demo);
    const historyKey = `falaleve_chat:${encodeURIComponent(String(psychologistId))}:${encodeURIComponent(String(patientId))}`;
    const messages = document.getElementById("messages");
    const form = document.getElementById("messageForm");
    const input = document.getElementById("messageInput");
    const status = document.getElementById("chatStatus");
    let history = [];
    let psychologistName = "Psicólogo";

    function readLocalHistory() {
        try {
            const saved = JSON.parse(localStorage.getItem(historyKey) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function formatTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function renderMessages() {
        messages.replaceChildren();
        const divider = document.createElement("div");
        divider.className = "date-divider";
        const label = document.createElement("span");
        label.textContent = history.length ? "Histórico da conversa" : "Início da conversa";
        divider.append(label);
        messages.append(divider);
        history.forEach(message => {
            const fromPsychologist = message.senderRole === "psychologist";
            const wrapper = document.createElement("div");
            wrapper.className = `message ${fromPsychologist ? "received" : "sent"}`;
            const bubble = document.createElement("div");
            bubble.className = "message-bubble";
            bubble.textContent = message.text;
            const time = document.createElement("span");
            time.className = "message-time";
            time.textContent = `${fromPsychologist ? psychologistName : "Você"} · ${formatTime(message.createdAt)}`;
            wrapper.append(bubble, time);
            messages.append(wrapper);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    async function requestJson(path, options) {
        const response = await fetch(path, options);
        let data;
        try { data = await response.json(); } catch { data = null; }
        if (!response.ok) {
            throw new Error(typeof data?.detail === "string" ? data.detail : `Falha na solicitação (HTTP ${response.status}).`);
        }
        return data;
    }

    async function loadMessages(showError = true) {
        if (isDemo) {
            history = readLocalHistory();
            renderMessages();
            return;
        }
        try {
            const allMessages = await requestJson("/mensagens?limite=200", {
                headers: { Accept: "application/json" }
            });
            history = allMessages
                .filter(message =>
                    String(message.id_paciente) === String(patientId)
                    && String(message.id_psicologo) === String(psychologistId)
                )
                .map(message => ({
                    senderRole: message.enviado_por === "psicologo" ? "psychologist" : "patient",
                    text: message.conteudo_texto,
                    createdAt: message.data_envio
                }))
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            renderMessages();
            status.textContent = "Mensagens sincronizadas com o servidor.";
            status.dataset.error = "false";
        } catch (error) {
            if (showError) {
                status.textContent = error.message;
                status.dataset.error = "true";
            }
        }
    }

    async function loadPsychologist() {
        if (isDemo) {
            const requestsKey = `falaleve_solicitacoes:${encodeURIComponent(String(psychologistId))}`;
            try {
                const requests = JSON.parse(localStorage.getItem(requestsKey) || "[]");
                const accepted = Array.isArray(requests) && requests.some(request =>
                    String(request.patientId || request.id_paciente) === String(patientId)
                    && ["aceita", "accepted"].includes(String(request.status || "").toLocaleLowerCase("pt-BR"))
                );
                if (!accepted) location.replace("../menu-paciente.html");
            } catch {
                location.replace("../menu-paciente.html");
            }
            return;
        }
        try {
            const psychologist = await requestJson(`/psicologos/${encodeURIComponent(psychologistId)}`, {
                headers: { Accept: "application/json" }
            });
            psychologistName = psychologist.nome_psicologo || psychologistName;
            document.getElementById("chatPatientName").textContent = `Conversa com ${psychologistName}`;
            document.getElementById("chatPatientTag").textContent = psychologistName;
        } catch (error) {
            status.textContent = error.message;
            status.dataset.error = "true";
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const sendButton = form.querySelector('button[type="submit"]');
        sendButton.disabled = true;
        if (isDemo) {
            history = readLocalHistory();
            history.push({
                senderRole: "patient",
                senderId: patientId,
                senderName: patient.nome_paciente || "Paciente",
                text,
                createdAt: new Date().toISOString()
            });
            try {
                localStorage.setItem(historyKey, JSON.stringify(history));
                input.value = "";
                renderMessages();
            } catch {
                status.textContent = "Não foi possível salvar a mensagem neste navegador.";
                status.dataset.error = "true";
            } finally {
                sendButton.disabled = false;
            }
            return;
        }
        try {
            await requestJson("/mensagens", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    id_paciente: Number(patientId),
                    id_psicologo: Number(psychologistId),
                    enviado_por: "paciente",
                    conteudo_texto: text
                })
            });
            input.value = "";
            await loadMessages(false);
            status.textContent = "Mensagem enviada.";
            status.dataset.error = "false";
        } catch (error) {
            status.textContent = error.message;
            status.dataset.error = "true";
        } finally {
            sendButton.disabled = false;
        }
    });

    document.getElementById("chatPatientName").textContent = "Conversa com seu psicólogo";
    document.getElementById("chatPatientTag").textContent = "Psicólogo";
    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("paciente");
        location.replace("../../entrar.html");
    });
    window.addEventListener("storage", event => {
        if (isDemo && event.key === historyKey) {
            history = readLocalHistory();
            renderMessages();
        }
    });
    document.getElementById("chatDisclaimer").textContent = isDemo
        ? "Modo demonstração: as mensagens ficam salvas neste navegador."
        : "Mensagens sincronizadas com o psicólogo pelo servidor.";
    loadPsychologist();
    loadMessages();
    if (!isDemo) window.setInterval(() => loadMessages(false), 10000);
})();

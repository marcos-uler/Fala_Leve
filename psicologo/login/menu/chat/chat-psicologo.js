document.addEventListener("DOMContentLoaded", async () => {
    let psychologist;
    try {
        psychologist = JSON.parse(sessionStorage.getItem("psicologo") || "null");
    } catch {
        sessionStorage.removeItem("psicologo");
    }
    if (!psychologist?.id_psicologo || !psychologist?.email_psicologo) {
        window.location.replace("../../entrar.html");
        return;
    }

    const isDemo = Boolean(psychologist.modo_demo);
    const profileKey = key => `${key}:${encodeURIComponent(String(psychologist.id_psicologo))}`;
    const patientsKey = profileKey("falaleve_pacientes");
    const notesKey = profileKey("falaleve_anotacoes");
    const patientId = new URLSearchParams(location.search).get("patientId");
    const feedback = document.getElementById("chatFeedback");

    function readArray(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function setFeedback(message, error = false) {
        feedback.textContent = message;
        feedback.dataset.error = String(error);
    }

    async function requestJson(path, options) {
        const response = await fetch(path, options);
        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }
        if (!response.ok) {
            const message = typeof data?.detail === "string" ? data.detail : `Falha na solicitação (HTTP ${response.status}).`;
            throw new Error(message);
        }
        return data;
    }

    let patient = readArray(patientsKey).find(item =>
        String(item.id ?? item.id_paciente) === String(patientId)
    );
    if (!patient && !isDemo && patientId && /^\d+$/.test(patientId)) {
        try {
            patient = await requestJson(`/pacientes/${encodeURIComponent(patientId)}`);
        } catch {
            patient = null;
        }
    }
    if (!patient || !patientId) {
        alert("Paciente não encontrado. Abra o chat pela lista de pacientes.");
        window.location.replace("../menu-psicologo.html");
        return;
    }

    const normalizedPatient = {
        ...patient,
        id: String(patient.id ?? patient.id_paciente),
        name: patient.name || patient.nome_paciente || patient.nome || "Paciente"
    };
    const patientName = normalizedPatient.name;
    document.getElementById("chatPatientName").textContent = `Conversa com ${patientName}`;
    document.getElementById("chatPatientTag").textContent = patientName;
    document.getElementById("logoutButton")?.addEventListener("click", () => {
        sessionStorage.removeItem("psicologo");
        window.location.href = "../../entrar.html";
    });

    const historyKey = `falaleve_chat:${encodeURIComponent(String(psychologist.id_psicologo))}:${encodeURIComponent(normalizedPatient.id)}`;
    const titleInput = document.getElementById("noteTitle");
    const contentInput = document.getElementById("noteContent");
    const messages = document.getElementById("messages");
    const messageForm = document.getElementById("messageForm");
    const messageInput = document.getElementById("messageInput");
    let history = readArray(historyKey);

    function formatTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    function renderMessages() {
        messages.replaceChildren();
        const divider = document.createElement("div");
        divider.className = "date-divider";
        const dividerText = document.createElement("span");
        dividerText.textContent = history.length ? "Histórico da conversa" : "Início da conversa";
        divider.append(dividerText);
        messages.append(divider);

        history.forEach(message => {
            const isPsychologist = message.senderRole === "psychologist";
            const wrapper = document.createElement("div");
            wrapper.className = `message ${isPsychologist ? "sent" : "received"}`;
            const bubble = document.createElement("div");
            bubble.className = "message-bubble";
            bubble.textContent = message.text;
            const time = document.createElement("span");
            time.className = "message-time";
            const sender = isPsychologist
                ? "Você · Psicólogo"
                : `Paciente · ${message.senderName || patientName}`;
            time.textContent = `${sender} · ${formatTime(message.createdAt)}`;
            wrapper.append(bubble, time);
            messages.append(wrapper);
        });
        messages.scrollTop = messages.scrollHeight;
    }

    async function loadMessages(showError = true) {
        if (isDemo) {
            history = readArray(historyKey);
            renderMessages();
            return;
        }
        try {
            const allMessages = await requestJson("/mensagens?limite=200", {
                headers: { Accept: "application/json" }
            });
            history = allMessages
                .filter(message =>
                    String(message.id_psicologo) === String(psychologist.id_psicologo)
                    && String(message.id_paciente) === normalizedPatient.id
                )
                .map(message => ({
                    senderRole: message.enviado_por === "psicologo" ? "psychologist" : "patient",
                    senderName: message.enviado_por === "psicologo" ? psychologist.nome_psicologo : patientName,
                    text: message.conteudo_texto,
                    createdAt: message.data_envio
                }))
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            renderMessages();
            setFeedback("");
        } catch (error) {
            if (showError) setFeedback(error.message, true);
        }
    }

    document.getElementById("saveNotes").addEventListener("click", async () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title && !content) {
            setFeedback("Escreva um título ou uma observação antes de salvar.", true);
            return;
        }

        if (!isDemo) {
            const anotacoes = title ? `${title}\n${content}` : content;
            try {
                await requestJson("/fichas-clinicas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                        id_paciente: Number(normalizedPatient.id),
                        id_psicologo: Number(psychologist.id_psicologo),
                        data_registro: new Date().toISOString().slice(0, 10),
                        anotacoes_avaliacao: anotacoes
                    })
                });
                titleInput.value = "";
                contentInput.value = "";
                setFeedback(`Registro clínico salvo no backend para ${patientName}.`);
            } catch (error) {
                setFeedback(error.message, true);
            }
            return;
        }

        const note = {
            id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            patientId: normalizedPatient.id,
            title: title || "Anotação do atendimento",
            content,
            date: new Date().toISOString(),
            source: "chat-psicologo"
        };
        try {
            localStorage.setItem(notesKey, JSON.stringify([...readArray(notesKey), note]));
            titleInput.value = "";
            contentInput.value = "";
            setFeedback(`Anotação de demonstração salva neste navegador para ${patientName}.`);
        } catch {
            setFeedback("Não foi possível salvar no armazenamento do navegador.", true);
        }
    });

    document.getElementById("clearNotes").addEventListener("click", () => {
        titleInput.value = "";
        contentInput.value = "";
        setFeedback("Campos limpos. Os registros já salvos foram mantidos.");
        titleInput.focus();
    });

    messageForm.addEventListener("submit", async event => {
        event.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        if (isDemo) {
            history.push({
                senderRole: "psychologist",
                senderId: psychologist.id_psicologo,
                senderName: psychologist.nome_psicologo || "Psicólogo",
                text,
                createdAt: new Date().toISOString()
            });
            try {
                localStorage.setItem(historyKey, JSON.stringify(history));
                messageInput.value = "";
                renderMessages();
                setFeedback("Mensagem de demonstração salva neste navegador.");
            } catch {
                setFeedback("Não foi possível salvar no armazenamento do navegador.", true);
            }
            return;
        }

        const sendButton = messageForm.querySelector('button[type="submit"]');
        sendButton.disabled = true;
        try {
            await requestJson("/mensagens", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                    id_paciente: Number(normalizedPatient.id),
                    id_psicologo: Number(psychologist.id_psicologo),
                    enviado_por: "psicologo",
                    conteudo_texto: text
                })
            });
            messageInput.value = "";
            await loadMessages(false);
            setFeedback("Mensagem enviada.");
        } catch (error) {
            setFeedback(error.message, true);
        } finally {
            sendButton.disabled = false;
        }
    });

    window.addEventListener("storage", event => {
        if (isDemo && event.key === historyKey) {
            history = readArray(historyKey);
            renderMessages();
        }
    });
    renderMessages();
    await loadMessages();
    if (!isDemo) window.setInterval(() => loadMessages(false), 10000);
});

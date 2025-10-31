document.addEventListener("DOMContentLoaded", function () {

    // --- VARIÁVEIS GLOBAIS ---
    const API_URL = 'http://localhost:3000/api';
    let appState = {
        userId: null,
        userName: "Técnico",
        userType: "tecnico",
        token: null,
        agendamentosPendentes: [],
        materiais: [],
        agendamentosHistorico: []
    };

    // --- Toast Global ---
    const globalToastEl = document.getElementById('globalToast');
    const globalToast = globalToastEl ? new bootstrap.Toast(globalToastEl) : null;

    // --- INICIALIZAÇÃO ---
    checkLogin();
    if (appState.token) {
        iniciarCarregamentoDados();
        iniciarListeners();
    }

    function checkLogin() {
        appState.userId = localStorage.getItem('userId');
        appState.userName = localStorage.getItem('userName');
        appState.userType = localStorage.getItem('userType');
        appState.token = localStorage.getItem('token');

        if (!appState.userId || !appState.userType || appState.userType !== 'tecnico' || !appState.token) {
            console.warn("Acesso não autorizado ou token inválido. Redirecionando para login.");
            localStorage.clear();
            window.location.href = 'telaLogin.html';
            return;
        }

        document.getElementById('nome-usuario').innerText = appState.userName;
        document.getElementById('tipo-usuario').innerText = appState.userType;
    }

    // --- Helper de Fetch ---
    async function fetchComToken(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${appState.token}`,
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 403) {
            // Token inválido ou expirado
            console.warn("Token inválido ou expirado. Deslogando.");
            localStorage.clear();
            window.location.href = 'telaLogin.html';
            throw new Error('Token inválido ou expirado.');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        
        if (response.status === 204) { // No Content
            return null;
        }

        return response.json();
    }

    // --- CARREGAMENTO DE DADOS (FETCH API) ---
    async function iniciarCarregamentoDados() {
        try {
            const [pendentes, materiais, historico] = await Promise.all([
                fetchComToken(`${API_URL}/tecnico/agendamentos/pendentes`),
                fetchComToken(`${API_URL}/materiais`),
                fetchComToken(`${API_URL}/agendamentos/historico`)
            ]);
            
            appState.agendamentosPendentes = pendentes;
            appState.materiais = materiais;
            appState.agendamentosHistorico = historico;
            
            // Renderizar
            renderAgendamentosPendentes();
            renderEstoque();
            renderHistorico();

        } catch (error) {
             console.error("Erro fatal ao carregar dados:", error);
            showAlert(error.message, "Erro de Conexão", "error");
            document.getElementById('lista-agendamentos-tbody').innerHTML = `<tr><td colspan="6" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
            document.getElementById('lista-estoque-tbody').innerHTML = `<tr><td colspan="5" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
            document.getElementById('lista-historico-tbody').innerHTML = `<tr><td colspan="6" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
        }
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    
    function renderAgendamentosPendentes() {
        const tbody = document.getElementById('lista-agendamentos-tbody');
        if (appState.agendamentosPendentes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" data-label="Aviso" class="text-center">Nenhum agendamento pendente.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = appState.agendamentosPendentes.map(aula => `
            <tr data-id="${aula.id_agendamento}">
                <td data-label="Professor">${aula.nome_professor || 'N/A'}</td>
                <td data-label="Data">${formatarData(aula.data_hora_inicio)}</td>
                <td data-label="Horário">${formatarHorario(aula.data_hora_inicio)} - ${formatarHorario(aula.data_hora_fim)}</td>
                <td data-label="Laboratório">${aula.nome_laboratorio || 'N/A'}</td>
                <td data-label="Kit">${aula.nome_kit || 'Nenhum'}</td>
                <td data-label="Ações" class="text-center acoes-cell">
                    <button class="btn btn-sm btn-outline-primary mx-1 btn-analisar-agendamento" data-id="${aula.id_agendamento}">Analisar</button>
                </td>
            </tr>
        `).join('');
    }
    
    function renderEstoque() {
        const tbody = document.getElementById('lista-estoque-tbody');
        if (appState.materiais.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" data-label="Aviso" class="text-center">Nenhum item no estoque.</td></tr>`;
            return;
        }

        tbody.innerHTML = appState.materiais.map(item => `
            <tr data-id="${item.id}">
                <td data-label="Item">${item.nome}</td>
                <td data-label="Descrição">${item.descricao || 'N/A'}</td>
                <td data-label="Tipo">${item.tipo_material}</td>
                <td data-label="Quantidade" class="text-center mobile-center">${item.quantidade} ${item.unidade}</td>
                <td data-label="Localização">${item.localizacao || 'N/A'}</td>
            </tr>
        `).join('');
    }
    
    function renderHistorico() {
        const tbody = document.getElementById('lista-historico-tbody');
        if (appState.agendamentosHistorico.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" data-label="Aviso" class="text-center">Nenhum histórico de agendamentos.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = appState.agendamentosHistorico.map(aula => `
            <tr data-id="${aula.id_agendamento}">
                <td data-label="Professor">${aula.nome_professor || 'N/A'}</td>
                <td data-label="Data">${formatarData(aula.data_hora_inicio)}</td>
                <td data-label="Laboratório">${aula.nome_laboratorio || 'N/A'}</td>
                <td data-label="Status" class="text-center mobile-center">
                    <span class="badge ${getStatusInfo(aula.status_agendamento).statusClasse}">
                        ${getStatusInfo(aula.status_agendamento).statusTexto}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // --- LÓGICA DE EVENTOS E MODAIS ---
    function iniciarListeners() {
        
        // --- Navegação entre Seções ---
        const navLinks = document.querySelectorAll('.nav-link[data-target]');
        const sections = document.querySelectorAll('.conteudo-secao');
        const navbarCollapse = document.getElementById('navbarNav');

        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('data-target');
                sections.forEach(section => section.classList.remove('ativo'));
                const targetSection = document.getElementById(targetId);
                if (targetSection) targetSection.classList.add('ativo');

                navLinks.forEach(navLink => navLink.classList.remove('active'));
                link.classList.add('active');

                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
                    bsCollapse.hide();
                }
            });
        });

        // --- Acessibilidade ---
        const body = document.body;
        const html = document.documentElement;
        const accessibilityBtn = document.getElementById('accessibilityBtn');
        const accessibilityDropdown = document.getElementById('accessibilityDropdown');

        if (accessibilityBtn && accessibilityDropdown) {
            accessibilityBtn.addEventListener('click', (e) => { e.stopPropagation(); accessibilityDropdown.classList.toggle('show'); });
        }
        window.addEventListener('click', (e) => {
            if (accessibilityDropdown && !accessibilityBtn.contains(e.target) && !accessibilityDropdown.contains(e.target)) {
                accessibilityDropdown.classList.remove('show');
            }
        });
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', (e) => { e.preventDefault(); body.classList.toggle('dark-mode'); localStorage.setItem('darkMode', body.classList.contains('dark-mode')); });
        }
        if (localStorage.getItem('darkMode') === 'true') body.classList.add('dark-mode');
        const increaseFontBtn = document.getElementById('increase-font');
        const decreaseFontBtn = document.getElementById('decrease-font');
        if (increaseFontBtn) increaseFontBtn.addEventListener('click', (e) => { e.preventDefault(); changeFontSize(0.1); });
        if (decreaseFontBtn) decreaseFontBtn.addEventListener('click', (e) => { e.preventDefault(); changeFontSize(-0.1); });
        function changeFontSize(step) {
            const currentSize = parseFloat(getComputedStyle(html).getPropertyValue('--font-size-base'));
            const newSize = Math.max(0.7, currentSize + step);
            html.style.setProperty('--font-size-base', `${newSize}rem`);
        }
        const colorModeLinks = document.querySelectorAll('#accessibilityDropdown [data-mode]');
        colorModeLinks.forEach(link => {
            link.addEventListener('click', (e) => { e.preventDefault(); const mode = link.getAttribute('data-mode'); body.classList.remove('protanopia', 'deuteranopia', 'tritanopia'); if (mode !== 'normal') body.classList.add(mode); });
        });

        // --- VLibras ---
        if (window.VLibras) {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
        }

        // --- Modal de Confirmação de Saída ---
        const modalConfirmarSaida = document.getElementById("modalConfirmarSaida");
        const btnFecharModalSaida = document.getElementById("fecharModalSaidaBtn");
        const btnCancelarSaida = document.getElementById("cancelarSaidaBtn");
        const btnConfirmarSaida = document.getElementById("confirmarSaidaBtn");
        const botaoSair = document.getElementById('botaoSair');

        function abrirModalSaida() { if (modalConfirmarSaida) modalConfirmarSaida.classList.add("visivel"); }
        function fecharModalSaida() { if (modalConfirmarSaida) modalConfirmarSaida.classList.remove("visivel"); }

        if(botaoSair) botaoSair.addEventListener("click", abrirModalSaida);
        if (btnFecharModalSaida) btnFecharModalSaida.addEventListener("click", fecharModalSaida);
        if (btnCancelarSaida) btnCancelarSaida.addEventListener("click", fecharModalSaida);
        if (btnConfirmarSaida) {
            btnConfirmarSaida.addEventListener("click", () => {
                localStorage.clear();
                window.location.href = 'telaLogin.html';
            });
        }
        adicionarCliqueFora(modalConfirmarSaida, fecharModalSaida);
        
        // --- Modal Adicionar Item Estoque ---
        const itemModal = document.getElementById("itemModal");
        const btnAdicionar = document.getElementById("abrirModalItemBtn");
        const btnFechar = document.getElementById("fecharModalItemBtn");
        const btnCancelar = document.getElementById("cancelarModalItemBtn");
        const formItem = document.getElementById("formItem");

        function abrirModalItem() { if (itemModal) itemModal.classList.add("visivel"); }
        function fecharModalItem() { if (itemModal) itemModal.classList.remove("visivel"); formItem.reset(); }

        if (btnAdicionar) btnAdicionar.addEventListener("click", abrirModalItem);
        if (btnFechar) btnFechar.addEventListener("click", fecharModalItem);
        if (btnCancelar) btnCancelar.addEventListener("click", fecharModalItem);
        adicionarCliqueFora(itemModal, fecharModalItem);
        
        if (formItem) {
            formItem.addEventListener("submit", async function (e) {
                e.preventDefault();
                const novoItem = {
                    nome: document.getElementById("itemNome").value,
                    descricao: document.getElementById("itemDesc").value,
                    localizacao: document.getElementById("itemLocal").value,
                    // CORRIGIDO: usa 'tipoUnidade' e 'valor' como no admin
                    tipoUnidade: document.getElementById('itemTipoUnidade').value, 
                    valor: parseFloat(document.getElementById('itemValor').value)
                };
                try {
                    const data = await fetchComToken(`${API_URL}/materiais`, {
                        method: 'POST',
                        body: JSON.stringify(novoItem)
                    });
                    showAlert(`Item "${data.nome}" cadastrado com sucesso!`, "Sucesso", "success");
                    location.reload(); // Recarrega
                } catch (error) {
                    console.error("Erro ao cadastrar item:", error);
                    showAlert(error.message, "Erro", "error");
                }
            });
        }
        
        // Lógica condicional (Unidade/Peso/Litros) do modal de estoque
        const tipoUnidadeSelect = document.getElementById('itemTipoUnidade');
        if (tipoUnidadeSelect) {
            tipoUnidadeSelect.addEventListener('change', (e) => {
                atualizarInputValor(e.target.value);
            });
        }

        // --- Modal Analisar Agendamento ---
        const analisarModal = document.getElementById("analisarModal");
        const btnFecharAnalisar = document.getElementById("fecharModalAnalisarBtn");
        const btnConfirmarAnalise = document.getElementById("btnConfirmarAnalise");
        const btnCancelarAnalise = document.getElementById("btnCancelarAnalise");

        function fecharModalAnalisar() { if (analisarModal) analisarModal.classList.remove("visivel"); }
        if (btnFecharAnalisar) btnFecharAnalisar.addEventListener("click", fecharModalAnalisar);
        adicionarCliqueFora(analisarModal, fecharModalAnalisar);
        
        // Ações dentro do modal de análise
        if (btnConfirmarAnalise) btnConfirmarAnalise.addEventListener('click', () => handleAnalise(btnConfirmarAnalise.dataset.id, 'confirmado'));
        if (btnCancelarAnalise) btnCancelarAnalise.addEventListener('click', () => handleAnalise(btnCancelarAnalise.dataset.id, 'cancelado'));
        
        async function handleAnalise(id, status) {
            try {
                await fetchComToken(`${API_URL}/tecnico/agendamentos/${id}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: status })
                });
                showAlert(`Agendamento ${status} com sucesso!`, 'Sucesso', 'success');
                location.reload();
            } catch (error) {
                showAlert(error.message, 'Erro', 'error');
            }
        }
        
        // --- Ações Dinâmicas (Delegação de Eventos) ---
        document.getElementById('lista-agendamentos-tbody').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (target && target.classList.contains('btn-analisar-agendamento')) {
                const id = target.dataset.id;
                abrirModalAnalisar(id);
            }
        });

    } // Fim de iniciarListeners()
    
    
    function abrirModalAnalisar(id) {
        const aula = appState.agendamentosPendentes.find(a => a.id_agendamento == id);
        if (!aula) return;
        
        // Popula os campos do modal
        document.getElementById('detalhe-professor').innerText = aula.nome_professor;
        document.getElementById('detalhe-lab-data').innerText = `${aula.nome_laboratorio} | ${formatarData(aula.data_hora_inicio)} (${formatarHorario(aula.data_hora_inicio)} - ${formatarHorario(aula.data_hora_fim)})`;
        document.getElementById('detalhe-kit-nome').innerText = aula.nome_kit || "Nenhum";
        document.getElementById('detalhe-kit-itens').value = aula.descricao_kit || "Nenhum kit solicitado.";
        document.getElementById('detalhe-observacoes').innerText = aula.observacoes || "Nenhuma.";
        
        // Armazena o ID nos botões para ação
        document.getElementById('btnConfirmarAnalise').dataset.id = id;
        document.getElementById('btnCancelarAnalise').dataset.id = id;
        
        document.getElementById('analisarModal').classList.add('visivel');
    }


    // --- FUNÇÕES AUXILIARES ---

    function adicionarCliqueFora(modalElement, fecharFn) {
        if (modalElement) {
            modalElement.addEventListener('click', (event) => {
                if (event.target === modalElement) {
                    fecharFn();
                }
            });
        }
    }
    
    function atualizarInputValor(tipo) {
        const containerValor = document.getElementById('containerValorEstoque');
        if (!containerValor) return;
        const valorLabel = containerValor.querySelector('label');
        const valorInput = containerValor.querySelector('input');
        if (!valorLabel || !valorInput) return;

        switch (tipo) {
            case 'unidade':
                valorLabel.textContent = 'Quantidade (UN)';
                valorInput.step = '1';
                valorInput.min = '1';
                valorInput.placeholder = 'Ex: 10';
                break;
            case 'peso':
                valorLabel.textContent = 'Peso (g)';
                valorInput.step = '0.01';
                valorInput.min = '0.01';
                valorInput.placeholder = 'Ex: 500.5';
                break;
            case 'litros':
                valorLabel.textContent = 'Volume (ml)';
                valorInput.step = '0.1';
                valorInput.min = '0.1';
                valorInput.placeholder = 'Ex: 250.5';
                break;
        }
    }

    function showAlert(message, title = "Notificação", type = "info") {
        if (!globalToast) {
            console.log(`[Alerta: ${title}] ${message}`);
            return;
        }
        const toastTitle = document.getElementById('toastTitle');
        const toastBody = document.getElementById('toastBody');
        const toastIconContainer = toastTitle.querySelector('i');
        globalToastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        let iconClass = '';
        if (type === 'success') {
            globalToastEl.classList.add('text-bg-success');
            iconClass = 'bi-check-circle-fill';
        } else if (type === 'error') {
            globalToastEl.classList.add('text-bg-danger');
             iconClass = 'bi-x-circle-fill';
        } else if (type === 'warning') {
            globalToastEl.classList.add('text-bg-warning');
             iconClass = 'bi-exclamation-triangle-fill';
        } else {
             globalToastEl.classList.add('text-bg-info');
             iconClass = 'bi-info-circle-fill';
        }
        if (toastIconContainer) {
            toastIconContainer.className = `bi ${iconClass} me-2`;
        }
        // Ajuste para garantir que o título seja atualizado corretamente
        if(toastTitle.childNodes.length > 1) {
             toastTitle.childNodes[1].nodeValue = ` ${title}`;
        } else {
             toastTitle.appendChild(document.createTextNode(` ${title}`));
        }
        toastBody.innerText = message;
        globalToast.show();
    }

    function getStatusInfo(status) {
        switch (status) {
            case 'confirmado':
                return { statusClasse: 'bg-success', statusTexto: 'Confirmado' };
            case 'pendente':
                return { statusClasse: 'bg-warning text-dark', statusTexto: 'Pendente' };
            case 'cancelado':
                return { statusClasse: 'bg-danger', statusTexto: 'Cancelado' };
            case 'concluido':
                 return { statusClasse: 'bg-secondary', statusTexto: 'Concluído' };
            default:
                return { statusClasse: 'bg-light text-dark', statusTexto: '?' };
        }
    }
    
    function formatarData(dataString) {
        if (!dataString) return 'N/A';
        try {
            const dataObj = new Date(dataString);
            const dia = String(dataObj.getUTCDate()).padStart(2, '0');
            const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
            const ano = dataObj.getUTCFullYear();
            return `${dia}/${mes}/${ano}`;
        } catch(e) {
            return dataString.split('T')[0];
        }
    }
    
    function formatarHorario(dataString) {
        if (!dataString) return 'N/A';
        try {
            const dataObj = new Date(dataString);
            const horas = String(dataObj.getUTCHours()).padStart(2, '0');
            const minutos = String(dataObj.getUTCMinutes()).padStart(2, '0');
            return `${horas}:${minutos}`;
        } catch(e) {
            return '00:00';
        }
    }

});


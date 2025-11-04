document.addEventListener("DOMContentLoaded", function () {

    // --- VARIÁVEIS GLOBAIS ---
    let appState = {
        userId: null,
        userName: "Professor",
        userType: "professor",
        token: null, // O token ainda é pego para o checkLogin
        agendamentos: [],
        kits: [],
        laboratorios: []
    };

    // --- Toast Global ---
    const globalToastEl = document.getElementById('globalToast');
    const globalToast = globalToastEl ? new bootstrap.Toast(globalToastEl) : null;

    // --- CAMADA DE SERVIÇO (Lógica de API) ---
    // Removida! Agora usamos window.apiService do arquivo apiService.js
    if (!window.apiService) {
        console.error("apiService.js não foi carregado corretamente.");
        showAlert("Erro crítico ao carregar a página. Recarregue.", "Erro", "error");
        return;
    }

    // --- INICIALIZAÇÃO ---
    checkLogin();
    if (appState.token) {
        iniciarCarregamentoDados();
        iniciarListenersGlobais();
        iniciarListenersFormularios();
        iniciarListenersDinamicos();
    }

    // Esta função permanece: ela protege a *entrada* na página
    function checkLogin() {
        appState.userId = localStorage.getItem('userId');
        appState.userName = localStorage.getItem('userName');
        appState.userType = localStorage.getItem('userType');
        appState.token = localStorage.getItem('token');

        if (!appState.userId || !appState.userType || appState.userType !== 'professor' || !appState.token) {
            console.warn("Acesso não autorizado ou token inválido. Redirecionando para login.");
            localStorage.clear();
            window.location.href = 'telaLogin.html';
            return;
        }

        document.getElementById('nome-usuario').innerText = appState.userName;
        document.getElementById('tipo-usuario').innerText = appState.userType;
    }

    // --- CARREGAMENTO DE DADOS (usando window.apiService) ---
    async function iniciarCarregamentoDados() {
        try {
            // Chama o serviço global
            const [agendamentos, kits, laboratorios] = await Promise.all([
                window.apiService.getAgendamentosProfessor(),
                window.apiService.getKits(),
                window.apiService.getLaboratorios()
            ]);

            appState.agendamentos = agendamentos;
            appState.kits = kits;
            appState.laboratorios = laboratorios;

            // Renderizar todas as seções
            renderDashboardCards();
            renderProximasAulas();
            renderHistorico();
            renderMeusKits();
            renderFormularioAgendamento();

            // Configurar o botão de último agendamento com os dados carregados
            configurarBotaoUltimoAgendamento();

        } catch (error) {
            console.error("Erro fatal ao carregar dados:", error);
            // Se o erro for de token, o apiService já redirecionou
            if (!error.message.includes("expirou")) {
                showAlert(error.message, "Erro de Conexão", "error");
            }
            document.getElementById('lista-proximas-aulas').innerHTML = '<p class="text-center text-danger p-3">Falha ao carregar agendamentos.</p>';
            document.getElementById('lista-meus-kits').innerHTML = '<p class="text-center text-danger p-3">Falha ao carregar kits.</p>';
            document.getElementById('lista-historico').innerHTML = '<tr><td colspan="5" data-label="Erro" class="text-center text-danger">Falha ao carregar histórico.</td></tr>';
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderDashboardCards() {
        const agora = new Date();
        const proximos = appState.agendamentos.filter(a => new Date(a.data_hora_inicio) > agora && a.status_agendamento !== 'cancelado');
        const preparados = proximos.filter(a => a.status_agendamento === 'confirmado');
        const aguardando = proximos.filter(a => a.status_agendamento === 'pendente');
        document.getElementById('card-proximas-aulas').innerText = proximos.length;
        document.getElementById('card-kits-preparados').innerText = preparados.length;
        document.getElementById('card-aguardando').innerText = aguardando.length;
        document.getElementById('card-meus-kits').innerText = appState.kits.length;
    }
    function renderProximasAulas() {
        const container = document.getElementById('lista-proximas-aulas');
        const agora = new Date();
        const proximosAgendamentos = appState.agendamentos.filter(a => 
            new Date(a.data_hora_inicio) > agora && a.status_agendamento !== 'cancelado'
        ).sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio));
        if (proximosAgendamentos.length === 0) {
            container.innerHTML = '<p class="text-center p-3">Nenhuma aula agendada.</p>';
            return;
        }
        container.innerHTML = proximosAgendamentos.map(aula => `
            <article class="card-aulas status-${aula.status_agendamento}" data-id="${aula.id_agendamento}">
                <div class="aula-cabecalho">
                    <div>
                        <span class="status-texto">${aula.status_agendamento}</span>
                        <h3 class="titulo">${aula.observacoes || 'Aula experimental'}</h3> 
                    </div>
                    <div class="data-horario">
                        <span>${formatarData(aula.data_hora_inicio)} - ${formatarHorario(aula.data_hora_inicio)}-${formatarHorario(aula.data_hora_fim)}</span>
                        <small>${aula.nome_laboratorio || 'Laboratório a definir'}</small>
                    </div>
                </div>
                <div class="aula-main">
                    <div class="aula-info"><span>Kit:</span> ${aula.nome_kit || 'Nenhum'}</div>
                    <div class="aula-info"><span>Status:</span> ${getStatusIcone(aula.status_agendamento)} ${aula.status_agendamento}</div>
                </div>
                <div class="aula-detalhes">
                    <button class="btn btn-link btn-ver-detalhes" data-id="${aula.id_agendamento}">Ver detalhes</button>
                    ${aula.status_agendamento === 'pendente' ? 
                        `<button class="btn btn-link btn-link-danger btn-cancelar-aula" data-id="${aula.id_agendamento}">Cancelar</button>` : 
                        ''}
                </div>
            </article>
        `).join('');
    }
    function renderHistorico() {
        const container = document.getElementById('lista-historico');
        const agora = new Date();
        const historico = appState.agendamentos.filter(a => 
            new Date(a.data_hora_inicio) <= agora || a.status_agendamento === 'cancelado'
        ).sort((a, b) => new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio));
        if (historico.length === 0) {
            container.innerHTML = '<tr><td colspan="5" data-label="Aviso" class="text-center">Nenhum histórico encontrado.</td></tr>';
            return;
        }
        container.innerHTML = historico.map(aula => `
            <tr data-id="${aula.id_agendamento}">
                <td data-label="Experimento">${aula.observacoes || 'Aula experimental'}</td>
                <td data-label="Laboratório">${aula.nome_laboratorio || 'N/A'}</td>
                <td data-label="Kit">${aula.nome_kit || 'N/A'}</td>
                <td data-label="Data">${formatarData(aula.data_hora_inicio)}</td>
                <td data-label="Status" class="text-center mobile-center">
                    <span class="status-texto status-${aula.status_agendamento}">${aula.status_agendamento}</span>
                </td>
            </tr>
        `).join('');
    }
    function renderMeusKits() {
        const container = document.getElementById('lista-meus-kits');
        if (appState.kits.length === 0) {
            container.innerHTML = '<p class="text-center p-3">Nenhum kit personalizado criado.</p>';
            return;
        }
        container.innerHTML = appState.kits.map(kit => `
            <div class="col-md-6 col-lg-4">
                <article class="cards-kits h-100" data-id="${kit.id}">
                    <div class="card-body d-flex flex-column">
                        <header class="cabecalho">
                            <h3 class="titulo">${kit.nome_kit}</h3>
                        </header>
                        <p class="descricao">${kit.descricao_kit || 'Sem descrição.'}</p>
                        <div class="data-utilizado mt-auto"></div>
                    </div>
                    <footer class="card-footer acoes">
                        <button class="btn btn-link btn-ver-kit" data-id="${kit.id}">Ver</button>
                        <button class="btn btn-link btn-editar-kit" data-id="${kit.id}">Editar</button>
                        <button class="btn btn-link btn-link-danger btn-excluir-kit" data-id="${kit.id}">Excluir</button>
                    </footer>
                </article>
            </div>
        `).join('');
    }
    function renderFormularioAgendamento() {
        const labContainer = document.getElementById('lista-laboratorios-form');
        if (appState.laboratorios.length > 0) {
            labContainer.innerHTML = appState.laboratorios.map((lab, index) => `
                <div class="col-md-4">
                    <div class="laboratorios-card">
                        <input type="radio" name="laboratorio" id="lab${lab.id}" value="${lab.id}" class="laboratorios-card-input" ${index === 0 ? 'checked' : ''} required>
                        <label for="lab${lab.id}" class="laboratorios-card-conteudo">
                            <strong>${lab.nome_laboratorio}</strong>
                            <small>${lab.localizacao_sala || 'Localização N/A'}</small>
                            <small>${lab.descricao || 'Sem descrição'}</small>
                        </label>
                    </div>
                </div>
            `).join('');
        } else {
            labContainer.innerHTML = '<p class="text-center text-danger">Nenhum laboratório encontrado.</p>';
        }
        const kitSelect = document.getElementById('select-kit-existente');
        if (appState.kits.length > 0) {
            kitSelect.innerHTML = '<option value="" disabled selected>Selecione um kit...</option>';
            appState.kits.forEach(kit => {
                kitSelect.innerHTML += `<option value="${kit.id}">${kit.nome_kit}</option>`;
            });
        } else {
            kitSelect.innerHTML = '<option value="" disabled>Nenhum kit personalizado encontrado.</option>';
        }
    }

    // --- LÓGICA DE NAVEGAÇÃO E MODAIS (Ações) ---
    function iniciarListenersGlobais() {
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
        const cardNovoAgendamento = document.getElementById("acao-novo-agendamento");
        const abaNovoAgendamento = document.querySelector(".nav-link[data-target='novo-agendamento']");
        if (cardNovoAgendamento && abaNovoAgendamento) {
            cardNovoAgendamento.addEventListener("click", (e) => { e.preventDefault(); abaNovoAgendamento.click(); });
        }
        const cardCriarKit = document.getElementById("acao-criar-kit");
        const abaMeusKits = document.querySelector('.nav-link[data-target="meus-kits"]');
        if (cardCriarKit && abaMeusKits) {
            cardCriarKit.addEventListener('click', (e) => { e.preventDefault(); abaMeusKits.click(); abrirModalKit(null); });
        }
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
        if (localStorage.getItem('darkMode') === 'true') {
            body.classList.add('dark-mode');
        }
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
    }
    
    // --- LÓGICA DE FORMULÁRIOS (usando window.apiService) ---
    function iniciarListenersFormularios() {
        const radioKitExistente = document.getElementById('kit-existente');
        const radioKitNovo = document.getElementById('kit-novo');
        const containerSelectKit = document.getElementById('container-select-kit');
        const containerNovoKit = document.getElementById('container-novo-kit');
        if (radioKitNovo) {
            radioKitNovo.disabled = true;
            radioKitNovo.parentElement.classList.add('text-muted');
        }
        if (radioKitExistente) radioKitExistente.checked = true;
        if (containerSelectKit) containerSelectKit.style.display = 'block';
        if (containerNovoKit) containerNovoKit.style.display = 'none';

        const formNovoAgendamento = document.getElementById('formNovoAgendamento');
        if (formNovoAgendamento) {
            formNovoAgendamento.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fk_kit = document.getElementById('select-kit-existente').value;
                const data = document.getElementById('data').value;
                const inicio = document.getElementById('horario-inicio').value;
                const fim = document.getElementById('horario-fim').value;
                const laboratorioRadio = document.querySelector('input[name="laboratorio"]:checked');
                if (!laboratorioRadio) {
                    showAlert('Por favor, selecione um laboratório.', 'Erro', 'error');
                    return;
                }
                const agendamento = {
                    data_hora_inicio: `${data}T${inicio}:00`,
                    data_hora_fim: `${data}T${fim}:00`,
                    fk_laboratorio: laboratorioRadio.value,
                    observacoes: document.getElementById('observacoes').value,
                    fk_kit: fk_kit || null,
                };
                try {
                    // Chama o serviço global
                    await window.apiService.createAgendamento(agendamento);
                    showAlert('Agendamento criado com sucesso! Aguardando confirmação.', 'Sucesso', 'success');
                    location.reload(); 
                } catch (error) {
                    console.error("Erro ao criar agendamento:", error);
                    showAlert(error.message, "Erro", "error");
                }
            });
        }

        const formNovoKit = document.getElementById("formNovoKit");
        if (formNovoKit) formNovoKit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const novoKit = {
                nome_kit: document.getElementById('kit-nome').value,
                descricao_kit: document.getElementById('kit-descricao').value
            };
            try {
                // Chama o serviço global
                await window.apiService.createKit(novoKit);
                showAlert('Kit criado com sucesso!', 'Sucesso', 'success');
                location.reload(); 
            } catch (error) {
                 console.error("Erro ao criar kit:", error);
                 showAlert(error.message, "Erro", "error");
            }
        });
        
        const formEditarKit = document.getElementById("formEditarKit");
        if (formEditarKit) formEditarKit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-kit-id').value;
            const kitAtualizado = {
                nome_kit: document.getElementById('edit-kit-nome').value,
                descricao_kit: document.getElementById('edit-kit-descricao').value
            };
            try {
                // Chama o serviço global
                await window.apiService.updateKit(id, kitAtualizado);
                showAlert('Kit atualizado com sucesso!', 'Sucesso', 'success');
                location.reload();
            } catch (error) {
                 console.error("Erro ao atualizar kit:", error);
                 showAlert(error.message, "Erro", "error");
            }
        });
    } 

    // --- Lógica de Modais ---
    function adicionarCliqueFora(modalElement, fecharFn) {
        if (modalElement) {
            modalElement.addEventListener('click', (event) => {
                if (event.target === modalElement) {
                    fecharFn();
                }
            });
        }
    }
    const modalNovoKit = document.getElementById("modalNovoKit");
    const botaoAbrirModalKit = document.getElementById("abrirModalKitBtn");
    const botaoFecharModalKit = document.getElementById("fecharModalKitBtn");
    const botaoCancelarModalKit = document.getElementById("cancelarModalKitBtn");
    const formNovoKitRef = document.getElementById("formNovoKit"); // Renomeado para evitar conflito de escopo
    function abrirModalKit() { if (modalNovoKit) modalNovoKit.classList.add("visivel"); }
    function fecharModalKit() { if (modalNovoKit) modalNovoKit.classList.remove("visivel"); if(formNovoKitRef) formNovoKitRef.reset(); }
    if (botaoAbrirModalKit) botaoAbrirModalKit.addEventListener("click", abrirModalKit);
    if (botaoFecharModalKit) botaoFecharModalKit.addEventListener("click", fecharModalKit);
    if (botaoCancelarModalKit) botaoCancelarModalKit.addEventListener("click", fecharModalKit);
    adicionarCliqueFora(modalNovoKit, fecharModalKit);

    const modalVerDetalhes = document.getElementById("modalVerDetalhes");
    const btnFecharModalVerDetalhes = document.getElementById("fecharModalVerDetalhesBtn");
    const btnFecharModalFooter = document.getElementById("fecharModalVerDetalhesBtn_footer");
    function fecharModalVerDetalhes() { if (modalVerDetalhes) modalVerDetalhes.classList.remove("visivel"); }
    if (btnFecharModalVerDetalhes) btnFecharModalVerDetalhes.addEventListener("click", fecharModalVerDetalhes);
    if (btnFecharModalFooter) btnFecharModalFooter.addEventListener("click", fecharModalVerDetalhes);
    adicionarCliqueFora(modalVerDetalhes, fecharModalVerDetalhes);
    function abrirModalVerDetalhes(id) {
        const aula = appState.agendamentos.find(a => a.id_agendamento == id);
        if (!aula) return;
        document.getElementById('detalhe-titulo').innerText = aula.observacoes || 'Aula experimental';
        document.getElementById('detalhe-status').innerHTML = `<span class="status-texto status-${aula.status_agendamento}">${aula.status_agendamento}</span>`;
        document.getElementById('detalhe-turma').innerText = 'N/A';
        document.getElementById('detalhe-alunos').innerText = 'N/A';
        document.getElementById('detalhe-lab').innerText = aula.nome_laboratorio || 'N/A';
        document.getElementById('detalhe-data').innerText = `${formatarData(aula.data_hora_inicio)} ${formatarHorario(aula.data_hora_inicio)}-${formatarHorario(aula.data_hora_fim)}`;
        document.getElementById('detalhe-kit').innerText = aula.nome_kit || 'Nenhum';
        document.getElementById('detalhe-obs').innerText = aula.observacoes || 'Nenhuma.';
        if (modalVerDetalhes) modalVerDetalhes.classList.add("visivel");
    }
    const modalEditarAula = document.getElementById("modalEditarAula");
    const btnFecharModalEditarAula = document.getElementById("fecharModalEditarAulaBtn");
    const btnCancelarModalEditarAula = document.getElementById("cancelarModalEditarAulaBtn");
    function fecharModalEditarAula() { if (modalEditarAula) modalEditarAula.classList.remove("visivel"); }
    if (btnFecharModalEditarAula) btnFecharModalEditarAula.addEventListener("click", fecharModalEditarAula);
    if (btnCancelarModalEditarAula) btnCancelarModalEditarAula.addEventListener("click", fecharModalEditarAula);
    adicionarCliqueFora(modalEditarAula, fecharModalEditarAula);
    const modalVerKit = document.getElementById("modalVerKit");
    const btnFecharModalVerKit = document.getElementById("fecharModalVerKitBtn");
    const btnFecharModalKitFooter = document.getElementById("fecharModalVerKitBtn_footer");
    function fecharModalVerKit() { if (modalVerKit) modalVerKit.classList.remove("visivel"); }
    if (btnFecharModalVerKit) btnFecharModalVerKit.addEventListener("click", fecharModalVerKit);
    if (btnFecharModalKitFooter) btnFecharModalKitFooter.addEventListener("click", fecharModalVerKit);
    adicionarCliqueFora(modalVerKit, fecharModalVerKit);
    function abrirModalVerKit(id) {
        const kit = appState.kits.find(k => k.id == id);
        if (!kit) return;
        document.getElementById('detalhe-kit-titulo').innerText = kit.nome_kit;
        document.getElementById('detalhe-kit-itens').innerText = kit.descricao_kit;
        document.getElementById('detalhe-kit-uso').innerText = 'Em desenvolvimento.';
        if (modalVerKit) modalVerKit.classList.add("visivel");
    }
    const modalEditarKit = document.getElementById("modalEditarKit");
    const btnFecharModalEditarKit = document.getElementById("fecharModalEditarKitBtn");
    const btnCancelarModalEditarKit = document.getElementById("cancelarModalEditarKitBtn");
    const formEditarKitRef = document.getElementById("formEditarKit"); // Renomeado
    function fecharModalEditarKit() { if (modalEditarKit) modalEditarKit.classList.remove("visivel"); if(formEditarKitRef) formEditarKitRef.reset(); }
    if (btnFecharModalEditarKit) btnFecharModalEditarKit.addEventListener("click", fecharModalEditarKit);
    if (btnCancelarModalEditarKit) btnCancelarModalEditarKit.addEventListener("click", fecharModalEditarKit);
    adicionarCliqueFora(modalEditarKit, fecharModalEditarKit);
    function abrirModalEditarKit(id) {
        const kit = appState.kits.find(k => k.id == id);
        if (!kit) return;
        document.getElementById('edit-kit-id').value = kit.id;
        document.getElementById('edit-kit-nome').value = kit.nome_kit;
        document.getElementById('edit-kit-descricao').value = kit.descricao_kit;
        if (modalEditarKit) modalEditarKit.classList.add("visivel");
    }

    // --- NOVA LÓGICA PARA O BOTÃO "ÚLTIMO AGENDAMENTO" ---
    function configurarBotaoUltimoAgendamento() {
        const botaoUltimoAgendamento = document.getElementById('acao-ultimo-agendamento');
        if (!botaoUltimoAgendamento) return;

        // Encontra o agendamento mais recente no passado
        const agora = new Date();
        const agendamentosPassados = appState.agendamentos
            .filter(a => new Date(a.data_hora_inicio) <= agora)
            .sort((a, b) => new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio));

        const ultimoAgendamento = agendamentosPassados[0];

        if (ultimoAgendamento) {
            botaoUltimoAgendamento.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalUltimoAgendamento(ultimoAgendamento);
            });
        } else {
            // Se não houver histórico, o botão vira "Novo Agendamento"
            const titulo = botaoUltimoAgendamento.querySelector('.titulo');
            const subtitulo = botaoUltimoAgendamento.querySelector('.subtitulo');
            if (titulo) titulo.textContent = 'Novo Agendamento';
            if (subtitulo) subtitulo.textContent = 'Clique para criar seu primeiro agendamento';
            
            // Leva para a aba de novo agendamento
            botaoUltimoAgendamento.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelector('.nav-link[data-target="novo-agendamento"]').click();
            });
        }
    }

    const modalUltimoAgendamento = document.getElementById("modalUltimoAgendamento");
    const btnFecharModalUltimoAgendamento = document.getElementById("fecharModalUltimoAgendamentoBtn");
    const btnFecharModalUltimoFooter = document.getElementById("fecharModalUltimoAgendamentoBtn_footer");

    function fecharModalUltimoAgendamento() {
        if (modalUltimoAgendamento) modalUltimoAgendamento.classList.remove("visivel");
    }

    if (btnFecharModalUltimoAgendamento) btnFecharModalUltimoAgendamento.addEventListener("click", fecharModalUltimoAgendamento);
    if (btnFecharModalUltimoFooter) btnFecharModalUltimoFooter.addEventListener("click", fecharModalUltimoAgendamento);
    adicionarCliqueFora(modalUltimoAgendamento, fecharModalUltimoAgendamento);

    function abrirModalUltimoAgendamento(aula) {
        if (!aula) return;
        // Popula os campos do novo modal
        document.getElementById('ultimo-agendamento-titulo').innerText = aula.observacoes || 'Aula experimental';
        document.getElementById('ultimo-agendamento-lab').innerText = aula.nome_laboratorio || 'N/A';
        document.getElementById('ultimo-agendamento-data').innerText = `${formatarData(aula.data_hora_inicio)} ${formatarHorario(aula.data_hora_inicio)}-${formatarHorario(aula.data_hora_fim)}`;
        document.getElementById('ultimo-agendamento-kit').innerText = aula.nome_kit || 'Nenhum';
        document.getElementById('ultimo-agendamento-obs').innerText = aula.observacoes || 'Nenhuma.';
        
        if (modalUltimoAgendamento) modalUltimoAgendamento.classList.add("visivel");
    }

    // --- Listeners de Eventos Dinâmicos (usando window.apiService) ---
    function iniciarListenersDinamicos() {
        document.getElementById('lista-proximas-aulas').addEventListener('click', async (e) => {
            const target = e.target.closest('button'); 
            if (!target) return;
            const id = target.dataset.id;
            if (!id) return;
            if (target.classList.contains('btn-ver-detalhes')) {
                abrirModalVerDetalhes(id);
            }
            if (target.classList.contains('btn-cancelar-aula')) {
                try {
                    // Chama o serviço global
                    await window.apiService.cancelarAgendamentoProfessor(id);
                    showAlert('Agendamento cancelado.', 'Aviso', 'warning');
                    location.reload();
                } catch (error) {
                    showAlert(error.message, 'Erro', 'error');
                }
            }
        });
        
        document.getElementById('lista-meus-kits').addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = target.dataset.id;
            if (!id) return;
            if (target.classList.contains('btn-ver-kit')) {
                abrirModalVerKit(id);
            }
            if (target.classList.contains('btn-editar-kit')) {
                abrirModalEditarKit(id);
            }
            if (target.classList.contains('btn-excluir-kit')) {
                 try {
                    // Chama o serviço global
                    await window.apiService.deleteKit(id);
                    showAlert('Kit excluído com sucesso.', 'Sucesso', 'success');
                    location.reload();
                } catch (error) {
                    showAlert(error.message, 'Erro', 'error');
                }
            }
        });
    } 

    // --- FUNÇÕES AUXILIARES ---
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
        // Garante que o nó de texto do título exista para ser atualizado
        if (toastTitle.childNodes[1]) {
            toastTitle.childNodes[1].nodeValue = ` ${title}`;
        } else {
            toastTitle.appendChild(document.createTextNode(` ${title}`));
        }
        toastBody.innerText = message;
        globalToast.show();
    }
    function getStatusIcone(status) {
        switch (status) {
            case 'confirmado': return '✅';
            case 'pendente': return '⌛';
            case 'cancelado': return '❌';
            case 'concluido': return '✔️';
            default: return '?';
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

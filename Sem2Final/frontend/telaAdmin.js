document.addEventListener('DOMContentLoaded', function () {

    // --- VARIÁVEIS GLOBAIS ---
    let appState = {
        userId: null,
        userName: "Admin",
        userType: "admin",
        token: null,
        materiais: [],
        // (Tarefa 1) Adicionado estado para o filtro
        filtroEstoque: ''
    };

    // --- Toast Global ---
    const globalToastEl = document.getElementById('globalToast');
    const globalToast = globalToastEl ? new bootstrap.Toast(globalToastEl) : null;

    // --- CAMADA DE SERVIÇO (Lógica de API) ---
    if (!window.apiService) {
        console.error("apiService.js não foi carregado corretamente.");
        showAlert("Erro crítico ao carregar a página. Recarregue.", "Erro", "error");
        return;
    }

    // --- INICIALIZAÇÃO ---
    if (checkLogin()) {
        iniciarCarregamentoDados();
        iniciarListeners();
    }

    function checkLogin() {
        appState.userId = localStorage.getItem('userId');
            renderEstoque(); // Renderiza a lista inicial
            renderUsuarios();
            renderEstoque();

        appState.userType = localStorage.getItem('userType');
        appState.token = localStorage.getItem('token');

        if (!appState.userId || !appState.userType || appState.userType !== 'admin' || !appState.token) {
            console.warn("Acesso não autorizado ou token inválido. Redirecionando para login.");
            localStorage.clear();
            window.location.href = 'telaLogin.html';
            return false; 
        }

        document.getElementById('nome-usuario').innerText = appState.userName;
        document.getElementById('tipo-usuario').innerText = appState.userType;
        return true; 
    }


    // --- CARREGAMENTO DE DADOS (usando window.apiService) ---
    async function iniciarCarregamentoDados() {
        try {
            const [agendamentos, usuarios, materiais] = await Promise.all([
                window.apiService.getAgendamentosAdmin(),
                window.apiService.getUsuarios(),
                window.apiService.getMateriais()
            ]);

            appState.agendamentos = agendamentos;
            appState.usuarios = usuarios;
            appState.materiais = materiais; // Guarda a lista completa

            // Renderizar tudo
            renderDashboard();
            renderAgendamentos();
            renderUsuarios();
            renderEstoque(); // Renderiza o estoque (agora filtrável)

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            if (!error.message.includes("expirou")) {
                showAlert(error.message, "Erro de Conexão", "error");
            }
            document.getElementById('lista-agendamentos-tbody').innerHTML = `<tr><td colspan="6" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
            document.getElementById('lista-usuarios-tbody').innerHTML = `<tr><td colspan="4" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
            document.getElementById('lista-estoque-tbody').innerHTML = `<tr><td colspan="5" data-label="Erro" class="text-center text-danger">Erro ao carregar dados.</td></tr>`;
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderDashboard() {
        const { agendamentos, usuarios, materiais } = appState;
        const pendentes = agendamentos.filter(a => a.status_agendamento === 'pendente').length;

        document.getElementById('card-agendamentos').innerText = agendamentos.length;
        document.getElementById('card-pendentes').innerText = pendentes;
        document.getElementById('card-usuarios').innerText = usuarios.length;
        document.getElementById('card-estoque').innerText = materiais.length;
    }
    
    function renderAgendamentos() {
        const tbody = document.getElementById('lista-agendamentos-tbody');
        if (appState.agendamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" data-label="Aviso" class="text-center">Nenhum agendamento encontrado.</td></tr>`;
            return;
        }
        tbody.innerHTML = appState.agendamentos.map(aula => {
            const { statusClasse, statusTexto } = getStatusInfo(aula.status_agendamento);
            return `
                <tr data-id="${aula.id_agendamento}">
                    <td data-label="Status"><span class="badge ${statusClasse}">${statusTexto}</span></td>
                    <td data-label="Professor">${aula.nome_professor || 'N/A'}</td>
                    <td data-label="Laboratório">${aula.nome_laboratorio || 'N/A'}</td>
                    <td data-label="Data">${formatarData(aula.data_hora_inicio)}</td>
                    <td data-label="Horário">${formatarHorario(aula.data_hora_inicio)} - ${formatarHorario(aula.data_hora_fim)}</td>
                    <td data-label="Ações" class="text-center acoes-cell">
                        ${aula.status_agendamento === 'pendente' ? 
                        `<button class="btn btn-sm btn-outline-success mx-1 btn-confirmar-agendamento" data-id="${aula.id_agendamento}">Confirmar</button>
                         <button class="btn btn-sm btn-outline-danger mx-1 btn-cancelar-agendamento" data-id="${aula.id_agendamento}">Cancelar</button>` :
                        (aula.status_agendamento === 'confirmado' ?
                        `<button class="btn btn-sm btn-outline-danger mx-1 btn-cancelar-agendamento" data-id="${aula.id_agendamento}">Cancelar</button>` : 
                        'N/A')
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function renderUsuarios() {
        const tbody = document.getElementById('lista-usuarios-tbody');
        if (appState.usuarios.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" data-label="Aviso" class="text-center">Nenhum usuário cadastrado.</td></tr>`;
            return;
        }
        tbody.innerHTML = appState.usuarios.map(user => `
            <tr data-id="${user.id}">
                <td data-label="Nome">${user.nome}</td>
                <td data-label="Email">${user.email}</td>
                <td data-label="Cargo">${user.tipo_usuario}</td>
                <td data-label="Ações" class="text-center acoes-cell">
                    ${user.id != appState.userId ? // Não pode excluir a si mesmo
                    `<button class="btn btn-sm btn-outline-danger mx-1 btn-remover-usuario" data-id="${user.id}">Remover</button>` : 
                    '(Usuário Atual)'}
                </td>
            </tr>
        `).join('');
    }

    // ATUALIZADO (Tarefa 1): Função agora filtra com base no input
    function renderEstoque() {
        const tbody = document.getElementById('lista-estoque-tbody');
        
        // (Tarefa 1) Pega o valor do filtro
        const filtroInput = document.getElementById('filtroEstoque');
        const filtroTexto = filtroInput ? filtroInput.value.toLowerCase() : '';

        // (Tarefa 1) Filtra a lista de materiais do estado
        const materiaisFiltrados = appState.materiais.filter(item => {
            return item.nome.toLowerCase().includes(filtroTexto) ||
                   (item.descricao && item.descricao.toLowerCase().includes(filtroTexto)) ||
                   (item.localizacao && item.localizacao.toLowerCase().includes(filtroTexto));
        });

        if (materiaisFiltrados.length === 0) {
            if (filtroTexto) {
                tbody.innerHTML = `<tr><td colspan="5" data-label="Aviso" class="text-center">Nenhum item encontrado para "${filtroTexto}".</td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="5" data-label="Aviso" class="text-center">Nenhum item no estoque.</td></tr>`;
            }
            return;
        }
        
        // Renderiza apenas os itens filtrados
        tbody.innerHTML = materiaisFiltrados.map(item => `
            <tr data-id="${item.id}">
                <td data-label="Item">${item.nome}</td>
                <td data-label="Descrição">${item.descricao || 'N/A'}</td>
                <td data-label="Tipo">${item.tipo_material} (${item.classificacao})</td>
                <td data-label="Quantidade" class="text-center mobile-center">${item.quantidade} ${item.unidade}</td>
                <td data-label="Localização">${item.localizacao || 'N/A'}</td>
            </tr>
        `).join('');
    }

    // --- LÓGICA DE EVENTOS E MODAIS (usando window.apiService) ---
    function iniciarListeners() {
        
        // --- Navegação ---
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
        if (window.VLibras) {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
        }

        // --- Modal Saída ---
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
        
        // --- Modal Cadastro Usuário ---
        const userModal = document.getElementById('userModal');
        const abrirUserModalBtn = document.getElementById('abrirModalBtn');
        const fecharUserModalBtn = document.getElementById('fecharModalBtn');
        const cancelarUserModalBtn = document.getElementById('cancelarModalBtn');
        const userForm = document.getElementById('formUsuario');
        const abrirUserModal = () => { if (userModal) userModal.classList.add('visivel'); }
        const fecharUserModal = () => { if (userModal) userModal.classList.remove('visivel'); userForm.reset(); }
        if (abrirUserModalBtn) abrirUserModalBtn.addEventListener('click', abrirUserModal);
        if (fecharUserModalBtn) fecharUserModalBtn.addEventListener('click', fecharUserModal);
        if (cancelarUserModalBtn) cancelarUserModalBtn.addEventListener('click', fecharUserModal);
        adicionarCliqueFora(userModal, fecharUserModal);

        if (userForm) {
            userForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                // ADICIONADO: Feedback de carregamento no botão
                const submitButton = userForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

                const novoUsuario = {
                    nome: document.getElementById('nome').value,
                    email: document.getElementById('email').value,
                    tipo_usuario: document.getElementById('cargo').value,
                    senha: document.getElementById('senha').value,
                };
                try {
                    // Chama o serviço global
                    const data = await window.apiService.createUsuario(novoUsuario);
                    showAlert(`Usuário "${data.nome}" cadastrado com sucesso!`, "Sucesso", "success");
                    
                    // CORRIGIDO: Atraso de 1.5s para o usuário ler o toast
                    setTimeout(() => {
                        location.reload(); 
                    }, 1500);

                } catch (error) {
                    console.error("Erro ao cadastrar usuário:", error);
                    showAlert(error.message, "Erro", "error");
                    
                    // ADICIONADO: Restaura o botão em caso de erro
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            });
        }

        // --- Modal Cadastro Estoque ---
        const estoqueModal = document.getElementById('estoqueModal');
        const abrirEstoqueModalBtn = document.getElementById('abrirModalEstoqueBtn');
        const fecharEstoqueModalBtn = document.getElementById('fecharModalEstoqueBtn');
        const cancelarEstoqueModalBtn = document.getElementById('cancelarModalEstoqueBtn');
        const estoqueForm = document.getElementById('formEstoque');
        const filtroInput = document.getElementById('filtroEstoque'); // (Tarefa 1) Pega o valor do filtro

        // (INÍCIO DA CORREÇÃO 1: Listeners do modal de estoque)
        // Definindo as funções para abrir/fechar o modal de estoque
        const abrirEstoqueModal = () => { if (estoqueModal) estoqueModal.classList.add('visivel'); }
        const fecharEstoqueModal = () => { 
            if (estoqueModal) estoqueModal.classList.remove('visivel'); 
            if (estoqueForm) estoqueForm.reset(); // Limpa o formulário ao fechar
        }

        // Adicionando os listeners que faltavam
        if (abrirEstoqueModalBtn) abrirEstoqueModalBtn.addEventListener('click', abrirEstoqueModal);
        if (fecharEstoqueModalBtn) fecharEstoqueModalBtn.addEventListener('click', fecharEstoqueModal);
        if (cancelarEstoqueModalBtn) cancelarEstoqueModalBtn.addEventListener('click', fecharEstoqueModal);
        adicionarCliqueFora(estoqueModal, fecharEstoqueModal);
        // (FIM DA CORREÇÃO 1)


        // ATUALIZADO (Etapa 1 / Tarefa 2): Formulário de estoque
        if (estoqueForm) {
            // (INÍCIO DA CORREÇÃO 2: Resposta do formulário)
            estoqueForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                // (ATUALIZADO) Feedback de carregamento no botão
                const submitButton = estoqueForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
                
                // Captura os dados dos novos campos
                const novoItem = {
                    nome: document.getElementById('itemNome').value,
                    descricao: document.getElementById('itemDesc').value,
                    localizacao: document.getElementById('itemLocal').value,
                    tipo_material: document.getElementById('itemTipoMaterial').value, 
                    classificacao: document.getElementById('itemClassificacao').value,
                    quantidade: parseFloat(document.getElementById('itemQuantidade').value),
                    unidade: document.getElementById('itemUnidade').value
                };
                
                try {
                    const data = await window.apiService.createMaterial(novoItem);
                    
                    showAlert(`Item "${data.nome}" cadastrado com sucesso!`, "Sucesso", "success");
                    
                    // (ATUALIZADO) Fecha o modal
                    fecharEstoqueModal();

                    // (ATUALIZADO) Recarrega após um atraso para o usuário ver o toast
                    setTimeout(() => {
                        location.reload(); 
                    }, 1500); // 1.5 segundos de atraso
                    
                } catch (error) {
                    console.error("Erro ao cadastrar item:", error);
                    showAlert(error.message, "Erro", "error");

                    // (ATUALIZADO) Restaura o botão em caso de erro
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            });
            // (FIM DA CORREÇÃO 2)
        }

        // REMOVIDO: Listener do 'itemTipoUnidade'
        
        // (Tarefa 1) Listener para o filtro
        if (filtroInput) {
            filtroInput.addEventListener('input', (e) => {
                appState.filtroEstoque = e.target.value; // Atualiza o estado
                renderEstoque(); // Re-renderiza a lista
            });
        }

        // (Tarefa 3) Listener para o botão Desfazer
        const btnDesfazer = document.getElementById('btnDesfazerEstoque');
        if (btnDesfazer) {
            btnDesfazer.addEventListener('click', async () => {
                // TODO: Adicionar um modal de confirmação "Tem certeza?"
                try {
                    btnDesfazer.disabled = true;
                    btnDesfazer.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Desfazendo...';
                    
                    await window.apiService.undoEstoqueChange();
                    
                    showAlert('Última alteração de estoque desfeita com sucesso!', 'Sucesso', 'success');
                    // Recarrega a página para ver a mudança
                    setTimeout(() => location.reload(), 1500); 
                    
                } catch (error) {
                    console.error("Erro ao desfazer:", error);
                    showAlert(error.message, "Erro", "error");
                    btnDesfazer.disabled = false;
                    btnDesfazer.innerHTML = '<i class="bi bi-arrow-counterclockwise me-2"></i>Desfazer';
                }
            });
        }


        // --- Ações Dinâmicas (Delegação de Eventos) ---
        document.getElementById('lista-agendamentos-tbody').addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id) return;
            if (target.classList.contains('btn-confirmar-agendamento')) {
                try {
                    // (Tarefa 4) - Na tela de admin, a confirmação é direta, sem pesos.
                    await window.apiService.updateStatusAgendamento(id, 'confirmado');
                    showAlert('Agendamento confirmado!', 'Sucesso', 'success');
                    location.reload();
                } catch (error) {
                    showAlert(error.message, 'Erro', 'error');
                }
            }
            if (target.classList.contains('btn-cancelar-agendamento')) {
                 try {
                    await window.apiService.updateStatusAgendamento(id, 'cancelado');
                    showAlert('Agendamento cancelado.', 'Aviso', 'warning');
                    location.reload();
                } catch (error) {
                    showAlert(error.message, 'Erro', 'error');
                }
            }
        });

        document.getElementById('lista-usuarios-tbody').addEventListener('click', async (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id || !target.classList.contains('btn-remover-usuario')) return;

            // ADICIONADO: Feedback de carregamento
            const originalButtonText = target.innerHTML;
            target.disabled = true;
            target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';


            // TODO: Adicionar modal de confirmação "Tem certeza?"
            try {
                // Chama o serviço global
                await window.apiService.deleteUsuario(id);
                showAlert('Usuário removido com sucesso.', 'Sucesso', 'success');

                // CORRIGIDO: Atraso de 1.5s para o usuário ler o toast
                setTimeout(() => {
                    location.reload();
                }, 1500);
                
            } catch (error) {
                showAlert(error.message, 'Erro ao remover', 'error');

                // ADICIONADO: Restaura o botão em caso de erro
                target.disabled = false;
                target.innerHTML = originalButtonText;
            }
        });
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

    // REMOVIDO: Função atualizarInputValor(tipo) não é mais necessária

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
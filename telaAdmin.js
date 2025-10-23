document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA DE NAVEGAÇÃO ENTRE SEÇÕES ---
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const sections = document.querySelectorAll('.conteudo-secao');
    const navbarCollapse = document.getElementById('navbarNav'); // Para fechar o menu sanduíche

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            const targetId = link.getAttribute('data-target');
            
            // Esconde todas as seções
            sections.forEach(section => {
                section.classList.remove('ativo');
            });

            // Mostra a seção alvo
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('ativo');
            }

            // Atualiza o estado 'active' nos links de navegação
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');

            // Fecha o menu sanduíche (se estiver visível)
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
                bsCollapse.hide();
            }
        });
    });

    // --- LÓGICA MODAL CADASTRO USUÁRIO ---
    const userModal = document.getElementById('userModal');
    const abrirUserModalBtn = document.getElementById('abrirModalBtn');
    const fecharUserModalBtn = document.getElementById('fecharModalBtn');
    const cancelarUserModalBtn = document.getElementById('cancelarModalBtn');
    const userForm = document.getElementById('formUsuario');

    const abrirUserModal = () => { if (userModal) userModal.classList.add('visivel'); }
    const fecharUserModal = () => { if (userModal) userModal.classList.remove('visivel'); }

    if (abrirUserModalBtn) abrirUserModalBtn.addEventListener('click', abrirUserModal);
    if (fecharUserModalBtn) fecharUserModalBtn.addEventListener('click', fecharUserModal);
    if (cancelarUserModalBtn) cancelarUserModalBtn.addEventListener('click', fecharUserModal);

    // Fecha ao clicar fora do card
    if (userModal) {
        userModal.addEventListener('click', (event) => {
            if (event.target === userModal) {
                fecharUserModal();
            }
        });
    }

    if (userForm) {
        userForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nome = document.getElementById('nome').value;
            // Simulação de cadastro - EVITAR ALERT()
            console.log(`Usuário "${nome}" cadastrado com sucesso! (Simulação)`);
            userForm.reset();
            fecharUserModal();
        });
    }

    // --- LÓGICA MODAL CADASTRO ESTOQUE (NOVO) ---
    const estoqueModal = document.getElementById('estoqueModal');
    const abrirEstoqueModalBtn = document.getElementById('abrirModalEstoqueBtn');
    const fecharEstoqueModalBtn = document.getElementById('fecharModalEstoqueBtn');
    const cancelarEstoqueModalBtn = document.getElementById('cancelarModalEstoqueBtn');
    const estoqueForm = document.getElementById('formEstoque');

    const abrirEstoqueModal = () => { if (estoqueModal) estoqueModal.classList.add('visivel'); }
    const fecharEstoqueModal = () => { if (estoqueModal) estoqueModal.classList.remove('visivel'); }

    if (abrirEstoqueModalBtn) abrirEstoqueModalBtn.addEventListener('click', abrirEstoqueModal);
    if (fecharEstoqueModalBtn) fecharEstoqueModalBtn.addEventListener('click', fecharEstoqueModal);
    if (cancelarEstoqueModalBtn) cancelarEstoqueModalBtn.addEventListener('click', fecharEstoqueModal);

    if (estoqueModal) {
        estoqueModal.addEventListener('click', (event) => {
            if (event.target === estoqueModal) {
                fecharEstoqueModal();
            }
        });
    }

    if (estoqueForm) {
        estoqueForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nome = document.getElementById('itemNome').value;
             // Simulação de cadastro - EVITAR ALERT()
            console.log(`Item "${nome}" cadastrado com sucesso! (Simulação)`);
            estoqueForm.reset();
            // Reseta o input de valor para o padrão (unidade)
            atualizarInputValor('unidade');
            fecharEstoqueModal();
        });
    }

    // Lógica condicional (Unidade/Peso/Litros) do modal de estoque
    const tipoUnidadeSelect = document.getElementById('itemTipoUnidade');
    
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
                valorInput.step = '0.01'; // Permite gramas (ex: 50.5g)
                valorInput.min = '0.01';
                valorInput.placeholder = 'Ex: 500.5';
                break;
            case 'litros':
                valorLabel.textContent = 'Volume (ml)';
                valorInput.step = '0.1'; // Permite mililitros (ex: 250.5ml)
                valorInput.min = '0.1';
                valorInput.placeholder = 'Ex: 250.5';
                break;
        }
    }

    if (tipoUnidadeSelect) {
        tipoUnidadeSelect.addEventListener('change', (e) => {
            atualizarInputValor(e.target.value);
        });
    }


    // --- LÓGICA DE ACESSIBILIDADE ---
    const body = document.body;
    const html = document.documentElement;

    // Dropdown de Acessibilidade
    const accessibilityBtn = document.getElementById('accessibilityBtn');
    const accessibilityDropdown = document.getElementById('accessibilityDropdown');

    if (accessibilityBtn && accessibilityDropdown) {
        accessibilityBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            accessibilityDropdown.classList.toggle('show');
        });
    }

    // Fecha o dropdown se clicar fora
    window.addEventListener('click', (event) => {
        if (accessibilityDropdown && !accessibilityBtn.contains(event.target) && !accessibilityDropdown.contains(event.target)) {
            accessibilityDropdown.classList.remove('show');
        }
    });


    // Modo Escuro
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            body.classList.toggle('dark-mode');
            // Salva a preferência no localStorage
            localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
        });
    }

    // Carrega a preferência de Modo Escuro ao carregar a página
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark-mode');
    }

    // Controle de Fonte
    const increaseFontBtn = document.getElementById('increase-font');
    const decreaseFontBtn = document.getElementById('decrease-font');
    const FONT_STEP = 0.1; // Incremento/decremento em rem

    if (increaseFontBtn) {
        increaseFontBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeFontSize(FONT_STEP);
        });
    }
    if (decreaseFontBtn) {
        decreaseFontBtn.addEventListener('click', (e) => {
            e.preventDefault();
            changeFontSize(-FONT_STEP);
        });
    }

    function changeFontSize(step) {
        const currentSize = parseFloat(getComputedStyle(html).getPropertyValue('--font-size-base'));
        const newSize = Math.max(0.7, currentSize + step); // Limite mínimo de 0.7rem
        html.style.setProperty('--font-size-base', `${newSize}rem`);
    }
    
    // Modos de Daltonismo
    const colorModeLinks = document.querySelectorAll('#accessibilityDropdown [data-mode]');
    colorModeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = link.getAttribute('data-mode');
            body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
            if(mode !== 'normal') {
                body.classList.add(mode);
            }
        });
    });

    // --- LÓGICA VLibras ---
    if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
    } else {
        console.warn("Widget VLibras não carregado a tempo.");
    }


    // Lógica do botão sair atualizada
    const botaoSair = document.getElementById('botaoSair');
    if (botaoSair) {
        botaoSair.addEventListener('click', function() {
            // Substituído 'confirm' por uma simulação de console, pois 'confirm' é bloqueado.
            console.log('Botão Sair clicado. Simulação de saída...');
            // const confirmacao = confirm('Deseja realmente sair do sistema?');
            // if (confirmacao) {
            //     localStorage.clear();
            //     window.location.href = '../TelaLogin/TelaLogin.html';
            // }
            // Em um app real, você implementaria um modal de confirmação customizado aqui.
            // Por enquanto, apenas redireciona (simulando que o usuário confirmou):
            localStorage.clear();
            // window.location.href = '../TelaLogin/TelaLogin.html'; // Descomente para ativar o redirecionamento
            console.log('Redirecionando para tela de login (simulação)...');
        });
    }

    // Garante que clicar na logo abra o site da ETEC na mesma aba
    const logoLink = document.getElementById('logoLink');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault(); // Previne o comportamento padrão do link
            window.location.href = 'https://etecjuliodemesquita.cps.sp.gov.br/';
        });
    }
});


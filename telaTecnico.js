document.addEventListener("DOMContentLoaded", function () {
    // --- NAVEGAÇÃO ---
    const sections = document.querySelectorAll("section[id^='item-']");
    const navLinks = document.querySelectorAll(".nav-link");

    function mostrarSection(tagId) {
        sections.forEach(section => {
            if (section.id === tagId) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }
        });

        // Atualiza classe ativa nos links
        navLinks.forEach(link => {
            if (link.getAttribute('data-target') === tagId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const tagId = this.getAttribute("data-target");
            mostrarSection(tagId);
        });
    });

    // Mostra a primeira seção por padrão
    mostrarSection("item-1");

    // Dropdown de Acessibilidade
    const accessibilityBtn = document.getElementById('accessibilityBtn');
    const accessibilityDropdown = document.getElementById('accessibilityDropdown');

    accessibilityBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        accessibilityDropdown.classList.toggle('show');
    });

    // Fecha o dropdown se clicar fora
    window.addEventListener('click', (event) => {
        if (!accessibilityBtn.contains(event.target) && !accessibilityDropdown.contains(event.target)) {
            accessibilityDropdown.classList.remove('show');
        }
    });

    // --- LÓGICA DE ACESSIBILIDADE ---
    const body = document.body;
    const html = document.documentElement;

    // Modo Escuro
    const darkModeToggle = document.getElementById('toggle-dark-mode');
    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        body.classList.toggle('dark-mode');
        // Salva a preferência no localStorage
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    });

    // Carrega a preferência de Modo Escuro ao carregar a página
    if (localStorage.getItem('darkMode') === 'true') {
        body.classList.add('dark-mode');
    }

    // Controle de Zoom do Texto
    const MIN_FONT_SIZE = 0.8;
    const MAX_FONT_SIZE = 2.0;
    const STEP_SIZE = 0.1;

    function updateFontSize(direction) {
        const html = document.documentElement;
        let currentSize = parseFloat(getComputedStyle(html).fontSize) / 16; // Converte px para rem
        let newSize = currentSize + (direction * STEP_SIZE);
        
        // Limitar tamanho mínimo e máximo
        newSize = Math.min(Math.max(newSize, MIN_FONT_SIZE), MAX_FONT_SIZE);
        
        // Aplica o novo tamanho
        html.style.setProperty('--font-size-base', `${newSize}rem`);
        
        // Salva no localStorage
        localStorage.setItem('fontSize', newSize);
    }

    // Aumentar fonte
    document.getElementById('increase-font').addEventListener('click', function(e) {
        e.preventDefault();
        updateFontSize(0.1);
    });

    // Diminuir fonte
    document.getElementById('decrease-font').addEventListener('click', function(e) {
        e.preventDefault();
        updateFontSize(-0.1);
    });

    // Carregar tamanho da fonte salvo
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.setProperty('--font-size-base', `${savedFontSize}rem`);
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

    // Lógica do botão sair atualizada
    const botaoSair = document.getElementById('botaoSair');
    botaoSair.addEventListener('click', function() {
        const confirmacao = confirm('Deseja realmente sair do sistema?');
        if (confirmacao) {
            localStorage.clear();
            window.location.href = '../TelaLogin/TelaLogin.html';
        }
    });

    // Lógica do Modal de Adicionar Item
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('itemModal');
        const btnAdicionar = document.querySelector('.button-adicionar');
        const btnFechar = document.getElementById('fecharModalBtn');
        const btnCancelar = document.getElementById('cancelarModalBtn');
        const formItem = document.getElementById('formItem');
        const tbody = document.querySelector('#item-2 .table tbody');

        // Funções do modal
        function abrirModal() {
            modal.classList.add('show');
        }

        function fecharModal() {
            modal.classList.remove('show');
            formItem.reset();
        }

        // Event Listeners
        btnAdicionar.addEventListener('click', abrirModal);
        btnFechar.addEventListener('click', fecharModal);
        btnCancelar.addEventListener('click', fecharModal);

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });

        // Submissão do formulário
        formItem.addEventListener('submit', function(e) {
            e.preventDefault();

            // Criar nova linha
            const tr = document.createElement('tr');
            tr.className = 'text-center';
            
            // Obter valores do formulário
            const item = document.getElementById('item').value;
            const descricao = document.getElementById('descricao').value;
            const quantidade = document.getElementById('quantidade').value;
            const localizacao = document.getElementById('localizacao').value;

            // Adicionar células
            tr.innerHTML = `
                <td>${item}</td>
                <td>${descricao}</td>
                <td>${quantidade}</td>
                <td>${localizacao}</td>
            `;

            // Adicionar à tabela
            tbody.appendChild(tr);

            // Fechar modal e limpar formulário
            fecharModal();
        });
    });
});
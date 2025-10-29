document.addEventListener("DOMContentLoaded", function () {

    // Lógica de navegação entre páginas
    const navLinks = document.querySelectorAll(".nav-link[data-target]")
    const sections = document.querySelectorAll(".conteudo-secao")

    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            // Previne o link de recarregar a página
            event.preventDefault()

            const targetID = link.getAttribute("data-target")

            // Esconde as outras seções
            sections.forEach(section => {
                section.classList.remove("ativo")
            })
            // Mostra a seção alvo
            const targetSection = document.getElementById(targetID)
            if (targetSection) {
                targetSection.classList.add("ativo")
            }
            // Atualiza o estado de ativo nos links de navegação
            navLinks.forEach(navLink => {
                navLink.classList.remove("active")
            })
            link.classList.add("active")
        })
    })

    // Lógica da acessibilidade
    const body = document.body
    const html = document.documentElement

    const accessibilityBtn = document.getElementById("accessibilityBtn")
    const accessibilityDropdown = document.getElementById("accessibilityDropdown")

    if (accessibilityBtn && accessibilityDropdown) {
        // Quando clicar o botão, mostra ou esconde o dropdown
        accessibilityBtn.addEventListener("click", (event) => {
            event.stopPropagation() // Impede que clicar feche imediatamente o menu
            accessibilityDropdown.classList.toggle("show")
        })
    }
    // Fecha o dropdown se o usuário clicar fora dele
    window.addEventListener("click", (event) => {
        if (accessibilityDropdown && !accessibilityBtn.contains(event.target) && !accessibilityDropdown.contains(event.target)) {
            accessibilityDropdown.classList.remove("show")
        }
    })

    // Darkmode
    const darkModeToggle = document.getElementById("toggle-dark-mode")

    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", (event) => {
            event.preventDefault()
            // Adicionar ou remover (toggle) a classe do darkmode
            body.classList.toggle("dark-mode")
            // Salvar no navegador -> preferência do usuário
            localStorage.setItem("darkMode", body.classList.contains("dark-mode"))
        })
    }
    // Verificar se o darkmode já foi ativado anteriormente (preferência do usuário)
    if (localStorage.getItem("darkMode") === "true") {
        body.classList.add("dark-mode")
    }

    // Fontes
    const increaseFontBtn = document.getElementById("increase-font")
    const decreaseFontBtn = document.getElementById("decrease-font")
    // O quanto a fonte vai aumentar/diminuir:
    const FONT_STEP = 0.1

    function changeFontSize(step) {
        // Pega o valor atual da variável "--font-size-base" do CSS
        const currentSize = parseFloat(getComputedStyle(html).getPropertyValue("--font-size-base"))
        // Limite = 0.7rem
        const newSize = Math.max(0.7, currentSize + step)
        html.style.setProperty("--font-size-base", `${newSize}rem`)
    }

    if (increaseFontBtn) {
        increaseFontBtn.addEventListener("click", (event) => {
            event.preventDefault()
            changeFontSize(FONT_STEP)
        })
    }
    if (decreaseFontBtn) {
        decreaseFontBtn.addEventListener("click", (event) => {
            event.preventDefault()
            changeFontSize(-FONT_STEP)
        })
    }

    // Daltonismo
    const colorModelLinks = document.querySelectorAll("#accessibilityDropdown [data-mode]")

    colorModelLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault()
            const mode = link.getAttribute("data-mode")
            // Limpa as classes de daltonismo
            body.classList.remove("protanopia", "deuteranopia", "tritanopia")
            if (mode !== "normal") {
                body.classList.add(mode)
            }
        })
    })

    // Botões do cabeçalho

    // Botão sair 
    const botaoSair = document.getElementById("botaoSair")
    if (botaoSair) {
        botaoSair.addEventListener("click", function (event) {
            window.location.href = "telaLogin.html"
        })
    }

    // Link da logo
    const logoLink = document.getElementById("logoLink")
    if (logoLink) {
        logoLink.addEventListener("click", function (event) {
            event.preventDefault()
            window.location.href = "https://etecjuliodemesquita.cps.sp.gov.br/"
        })
    }

    // Lógica dos cards de ação rápida - Dashboard

    // Novo agendamento
    const cardNovoAgendamento = document.getElementById("acao-novo-agendamento")
    const abaNovoAgendamento = document.querySelector(".nav-link[data-target = 'novo-agendamento']")

    if (cardNovoAgendamento && abaNovoAgendamento) {
        cardNovoAgendamento.addEventListener("click", function (event) {
            event.preventDefault()
            // Vai pra aba Novo Agendamento
            abaNovoAgendamento.click()
        })
    }

    // Criar kit
    const cardCriarKit = document.getElementById("acao-criar-kit");
    const abaMeusKits = document.querySelector('.nav-link[data-target="meus-kits"]');

    if (cardCriarKit && abaMeusKits) {
        cardCriarKit.addEventListener('click', function (event) {
            event.preventDefault();
            // Vai para a aba "Meus Kits" e abre o modal
            abaMeusKits.click();
            abrirModalKit();
        });
    }

    // Modal "Novo Kit" - Meus Kits
    const modalNovoKit = document.getElementById("modalNovoKit");
    const modalBackdrop = document.getElementById("modalNovoKitBackdrop");
    const botaoAbrirModalKit = document.querySelector(".botao-novo-kit"); // O botão "+ Novo Kit"
    const botaoFecharModalKit = document.getElementById("fecharModalKitBtn"); // O 'X' no header
    const botaoCancelarModalKit = document.getElementById("cancelarModalKitBtn"); // O botão "Cancelar"

    function abrirModalKit() {
        if (modalNovoKit && modalBackdrop) {
            modalNovoKit.classList.add("show");
            modalBackdrop.classList.add("show");
        }
    }

    function fecharModalKit() {
        if (modalNovoKit && modalBackdrop) {
            modalNovoKit.classList.remove("show");
            modalBackdrop.classList.remove("show");
        }
    }

    if (botaoAbrirModalKit) {
        botaoAbrirModalKit.addEventListener("click", function (event) {
            event.preventDefault();
            abrirModalKit();
        });
    }

    if (botaoFecharModalKit) {
        botaoFecharModalKit.addEventListener("click", fecharModalKit);
    }

    if (botaoCancelarModalKit) {
        botaoCancelarModalKit.addEventListener("click", fecharModalKit);
    }

    // Fechar o modal ao clicar no fundo
    if (modalBackdrop) {
        modalBackdrop.addEventListener("click", fecharModalKit);
    }

    // Modal "Ver detalhes"
    const modalVerDetalhes = document.getElementById("modalVerDetalhes");
    const modalVerDetalhesBackdrop = document.getElementById("modalVerDetalhesBackdrop");
    const btnFecharModalVerDetalhes = document.getElementById("fecharModalVerDetalhesBtn");
    const btnFecharModalFooter = document.getElementById("fecharModalVerDetalhesBtn_footer");

    // Pega todos os botões de "Ver Detalhes"
    const botoesVerDetalhes = document.querySelectorAll(".btn-ver-detalhes");

    function abrirModalVerDetalhes() {
        if (modalVerDetalhes && modalVerDetalhesBackdrop) {
            modalVerDetalhes.classList.add("show");
            modalVerDetalhesBackdrop.classList.add("show");
        }
    }

    function fecharModalVerDetalhes() {
        if (modalVerDetalhes && modalVerDetalhesBackdrop) {
            modalVerDetalhes.classList.remove("show");
            modalVerDetalhesBackdrop.classList.remove("show");
        }
    }

    botoesVerDetalhes.forEach(botao => {
        botao.addEventListener("click", function (event) {
            event.preventDefault();
            // NOTA: Quando conectarmos ao banco, pegaremos os dados do card
            // antes de chamar a função de abrir.
            abrirModalVerDetalhes();
        });
    });

    // Fechar o modal
    if (btnFecharModalVerDetalhes) {
        btnFecharModalVerDetalhes.addEventListener("click", fecharModalVerDetalhes);
    }
    if (btnFecharModalFooter) {
        btnFecharModalFooter.addEventListener("click", fecharModalVerDetalhes);
    }
    if (modalVerDetalhesBackdrop) {
        modalVerDetalhesBackdrop.addEventListener("click", fecharModalVerDetalhes);
    }

    // Modal "Editar" (editar aulas agendadas)
    const modalEditarAula = document.getElementById("modalEditarAula");
    const modalEditarAulaBackdrop = document.getElementById("modalEditarAulaBackdrop");
    const btnFecharModalEditarAula = document.getElementById("fecharModalEditarAulaBtn");
    const btnCancelarModalEditarAula = document.getElementById("cancelarModalEditarAulaBtn");

    // Pega todos os botões de "Editar"
    const botoesEditarAula = document.querySelectorAll(".btn-editar-aula");

    // Funções para abrir e fechar
    function abrirModalEditarAula() {
        // Pegar dados da aula e preencher os campos do formulário
        if (modalEditarAula && modalEditarAulaBackdrop) {
            modalEditarAula.classList.add("show");
            modalEditarAulaBackdrop.classList.add("show");
        }
    }

    function fecharModalEditarAula() {
        if (modalEditarAula && modalEditarAulaBackdrop) {
            modalEditarAula.classList.remove("show");
            modalEditarAulaBackdrop.classList.remove("show");
        }
    }

    // Evento de clique para cada botão "Editar"
    botoesEditarAula.forEach(botao => {
        botao.addEventListener("click", function (event) {
            event.preventDefault();
            // NOTA: No futuro, pegaremos os dados do card aqui
            // e os usaremos para preencher o formulário antes de abrir.
            abrirModalEditarAula();
        });
    });

    // Eventos para fechar o modal
    if (btnFecharModalEditarAula) {
        btnFecharModalEditarAula.addEventListener("click", fecharModalEditarAula);
    }
    if (btnCancelarModalEditarAula) {
        btnCancelarModalEditarAula.addEventListener("click", fecharModalEditarAula);
    }
    if (modalEditarAulaBackdrop) {
        modalEditarAulaBackdrop.addEventListener("click", fecharModalEditarAula);
    }

    // Modal "Ver Kit"
    const modalVerKit = document.getElementById("modalVerKit");
    const modalVerKitBackdrop = document.getElementById("modalVerKitBackdrop");
    const btnFecharModalVerKit = document.getElementById("fecharModalVerKitBtn");
    const btnFecharModalKitFooter = document.getElementById("fecharModalVerKitBtn_footer");

    const botoesVerKit = document.querySelectorAll(".btn-ver-kit");

    function abrirModalVerKit() {
        // Futuramente: passar os dados do kit aqui para preencher os campos do pop-up
        if (modalVerKit && modalVerKitBackdrop) {
            modalVerKit.classList.add("show");
            modalVerKitBackdrop.classList.add("show");
        }
    }

    function fecharModalVerKit() {
        if (modalVerKit && modalVerKitBackdrop) {
            modalVerKit.classList.remove("show");
            modalVerKitBackdrop.classList.remove("show");
        }
    }

    botoesVerKit.forEach(botao => {
        botao.addEventListener("click", function (event) {
            event.preventDefault();
            // NOTA: Pegaremos os dados do card antes de abrir
            abrirModalVerKit();
        });
    });

    if (btnFecharModalVerKit) {
        btnFecharModalVerKit.addEventListener("click", fecharModalVerKit);
    }
    if (btnFecharModalKitFooter) {
        btnFecharModalKitFooter.addEventListener("click", fecharModalVerKit);
    }
    if (modalVerKitBackdrop) {
        modalVerKitBackdrop.addEventListener("click", fecharModalVerKit);
    }

    // Modal "Editar Kit"
    const modalEditarKit = document.getElementById("modalEditarKit");
    const modalEditarKitBackdrop = document.getElementById("modalEditarKitBackdrop");
    const btnFecharModalEditarKit = document.getElementById("fecharModalEditarKitBtn");
    const btnCancelarModalEditarKit = document.getElementById("cancelarModalEditarKitBtn");

    const botoesEditarKit = document.querySelectorAll(".btn-editar-kit");

    function abrirModalEditarKit() {
        // Pegar dados do kit e preencher campos
        if (modalEditarKit && modalEditarKitBackdrop) {
            modalEditarKit.classList.add("show");
            modalEditarKitBackdrop.classList.add("show");
        }
    }

    function fecharModalEditarKit() {
        if (modalEditarKit && modalEditarKitBackdrop) {
            modalEditarKit.classList.remove("show");
            modalEditarKitBackdrop.classList.remove("show");
        }
    }

    botoesEditarKit.forEach(botao => {
        botao.addEventListener("click", function (event) {
            event.preventDefault();
            // Pegar dados do card e preencher formulário antes de abrir
            abrirModalEditarKit();
        });
    });

    if (btnFecharModalEditarKit) {
        btnFecharModalEditarKit.addEventListener("click", fecharModalEditarKit);
    }
    if (btnCancelarModalEditarKit) {
        btnCancelarModalEditarKit.addEventListener("click", fecharModalEditarKit);
    }
    if (modalEditarKitBackdrop) {
        modalEditarKitBackdrop.addEventListener("click", fecharModalEditarKit);
    }

})
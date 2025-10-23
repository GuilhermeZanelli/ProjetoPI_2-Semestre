// --- LÓGICA DE NAVEGAÇÃO ENTRE SEÇÕES ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.conteudo-secao');

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
    });
});
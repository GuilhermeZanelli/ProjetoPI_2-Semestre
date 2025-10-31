document.addEventListener('DOMContentLoaded', function() {
    const novaSenhaForm = document.getElementById('novaSenhaForm');
    const changeButton = document.getElementById('change-password-button');
    // CORRIGIDO: O ID no HTML é 'senha-error', não 'error-message'
    const errorMessage = document.getElementById('senha-error'); 
    const API_URL = 'http://localhost:3000/api';

    // Pega o e-mail salvo na etapa anterior
    const email = localStorage.getItem('emailParaRecuperar');
    if (!email) {
        // CORRIGIDO: Usa a div de erro em vez de alert
        errorMessage.querySelector('p').textContent = 'Nenhum e-mail encontrado para recuperação. Por favor, volte ao início.';
        errorMessage.style.display = 'block';
        // Desabilita o botão se não houver e-mail
        changeButton.disabled = true; 
        return;
    }

    if (novaSenhaForm) {
        novaSenhaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const novaSenha = document.getElementById('nova-senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            if (novaSenha !== confirmarSenha) {
                errorMessage.querySelector('p').textContent = 'As senhas não coincidem. Tente novamente.';
                errorMessage.style.display = 'block';
                errorMessage.classList.remove('success-message'); // Garante que não fique verde
                return;
            }
            
            errorMessage.style.display = 'none';
            changeButton.disabled = true;
            changeButton.textContent = 'Alterando...';

            try {
                const response = await fetch(`${API_URL}/nova-senha`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, novaSenha: novaSenha })
                });

                const data = await response.json();

                if (response.ok) {
                    // --- SUCESSO (SEM ALERT) ---
                    // CORRIGIDO: Mostra a mensagem de sucesso na div
                    errorMessage.querySelector('p').textContent = 'Senha alterada com sucesso! Redirecionando para o login...';
                    errorMessage.classList.add('success-message'); // Adiciona classe para estilizar (precisa de CSS)
                    errorMessage.style.display = 'block';
                    
                    localStorage.removeItem('emailParaRecuperar'); // Limpa o e-mail
                    
                    // Redireciona após 2 segundos
                    setTimeout(() => {
                        window.location.href = 'telaLogin.html';
                    }, 2000);
                    // --- Fim da correção ---

                } else {
                    // Erro
                    errorMessage.querySelector('p').textContent = data.error || 'Erro ao alterar a senha.';
                    errorMessage.classList.remove('success-message');
                    errorMessage.style.display = 'block';
                }

            } catch (error) {
                console.error("Erro ao alterar senha:", error);
                errorMessage.querySelector('p').textContent = 'Não foi possível conectar ao servidor.';
                errorMessage.classList.remove('success-message');
                errorMessage.style.display = 'block';
            }

            // Só reabilita o botão se der erro
            if (!response.ok) {
                changeButton.disabled = false;
                changeButton.textContent = 'Alterar Senha';
            }
        });
    }

    // Limpa o erro de "senhas não coincidem" ao digitar
    document.getElementById('confirmar-senha').addEventListener('input', function() {
        if (errorMessage.querySelector('p').textContent === 'As senhas não coincidem. Tente novamente.') {
            errorMessage.style.display = 'none';
        }
    });
});


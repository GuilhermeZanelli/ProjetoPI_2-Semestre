document.addEventListener('DOMContentLoaded', function() {
    const novaSenhaForm = document.getElementById('novaSenhaForm');
    const changeButton = document.getElementById('change-password-button');
    const errorMessage = document.getElementById('senha-error'); 
    const API_URL = 'http://localhost:3000/api';

    // Pega o e-mail salvo na etapa anterior
    const email = localStorage.getItem('emailParaRecuperar');
    if (!email) {
        errorMessage.querySelector('p').textContent = 'Nenhum e-mail encontrado para recuperação. Por favor, volte ao início.';
        errorMessage.style.display = 'block';
        changeButton.disabled = true; 
        return;
    }

    // --- CAMADA DE SERVIÇO (Lógica de API) ---
    const apiService = {
        /**
         * Define uma nova senha para o usuário.
         * @param {string} email 
         * @param {string} novaSenha 
         * @returns {Promise<object>} Resposta da API.
         */
        definirNovaSenha: async (email, novaSenha) => {
            const response = await fetch(`${API_URL}/nova-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, novaSenha: novaSenha })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar a senha.');
            }
            return data;
        }
    };

    // --- LÓGICA DE UI (Event Listeners) ---
    if (novaSenhaForm) {
        novaSenhaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const novaSenha = document.getElementById('nova-senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            if (novaSenha !== confirmarSenha) {
                errorMessage.querySelector('p').textContent = 'As senhas não coincidem. Tente novamente.';
                errorMessage.style.display = 'block';
                errorMessage.classList.remove('success-message');
                return;
            }
            
            errorMessage.style.display = 'none';
            changeButton.disabled = true;
            changeButton.textContent = 'Alterando...';

            try {
                // Chama a camada de serviço
                await apiService.definirNovaSenha(email, novaSenha);

                // --- SUCESSO ---
                errorMessage.querySelector('p').textContent = 'Senha alterada com sucesso! Redirecionando para o login...';
                errorMessage.classList.add('success-message');
                errorMessage.style.display = 'block';
                
                localStorage.removeItem('emailParaRecuperar');
                
                setTimeout(() => {
                    window.location.href = 'telaLogin.html';
                }, 2000);

            } catch (error) {
                // --- ERRO ---
                console.error("Erro ao alterar senha:", error);
                errorMessage.querySelector('p').textContent = error.message || 'Não foi possível conectar ao servidor.';
                errorMessage.classList.remove('success-message');
                errorMessage.style.display = 'block';
                
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

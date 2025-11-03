document.addEventListener("DOMContentLoaded", () => {
    const recoverForm = document.getElementById("recuperarSenhaForm");
    const recoverButton = document.getElementById("recover-button");
    const errorMessage = document.getElementById("error-message");
    const API_URL = 'http://localhost:3000/api';

    // --- CAMADA DE SERVIÇO (Lógica de API) ---
    const apiService = {
        /**
         * Solicita a recuperação de senha para um e-mail.
         * @param {string} email 
         * @returns {Promise<object>} Resposta da API.
         */
        recuperarSenha: async (email) => {
            const response = await fetch(`${API_URL}/recuperar-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro desconhecido.');
            }
            return data;
        }
    };

    // --- LÓGICA DE UI (Event Listeners) ---
    if (recoverForm) {
        recoverForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            recoverButton.disabled = true;
            recoverButton.textContent = "Verificando...";
            errorMessage.style.display = 'none';

            const email = document.getElementById("email").value;

            try {
                // Chama a camada de serviço
                await apiService.recuperarSenha(email);

                // Sucesso! E-mail encontrado.
                // Armazena o e-mail para o próximo passo e redireciona.
                localStorage.setItem('emailParaRecuperar', email);
                window.location.href = 'novaSenha.html';

            } catch (error) {
                // Erro (e-mail não encontrado)
                console.error("Erro ao tentar recuperar senha:", error);
                errorMessage.querySelector('p').textContent = error.message || 'Não foi possível conectar ao servidor.';
                errorMessage.style.display = 'block';
                
                recoverButton.disabled = false;
                recoverButton.textContent = "Recuperar Senha";
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const recoverForm = document.getElementById("recuperarSenhaForm");
    const recoverButton = document.getElementById("recover-button");
    const errorMessage = document.getElementById("error-message");
    const API_URL = 'http://localhost:3000/api';

    if (recoverForm) {
        recoverForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            recoverButton.disabled = true;
            recoverButton.textContent = "Verificando...";
            errorMessage.style.display = 'none';

            const email = document.getElementById("email").value;

            try {
                const response = await fetch(`${API_URL}/recuperar-senha`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (response.ok) {
                    // Sucesso! E-mail encontrado.
                    // Armazena o e-mail para o próximo passo e redireciona.
                    localStorage.setItem('emailParaRecuperar', email);
                    window.location.href = 'novaSenha.html';
                } else {
                    // Erro (e-mail não encontrado)
                    errorMessage.querySelector('p').textContent = data.error || 'Erro desconhecido.';
                    errorMessage.style.display = 'block';
                }

            } catch (error) {
                console.error("Erro ao tentar recuperar senha:", error);
                errorMessage.querySelector('p').textContent = 'Não foi possível conectar ao servidor.';
                errorMessage.style.display = 'block';
            }

            recoverButton.disabled = false;
            recoverButton.textContent = "Recuperar Senha";
        });
    }
});
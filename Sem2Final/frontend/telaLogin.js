document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginButton = document.getElementById("login-button");
    const loginError = document.getElementById("login-error");
    const API_URL = 'http://localhost:3000/api';

    // --- CAMADA DE SERVIÇO (Lógica de API) ---
    const apiService = {
        /**
         * Tenta autenticar o usuário.
         * @param {string} email 
         * @param {string} password 
         * @param {string} tipo_usuario 
         * @returns {Promise<object>} Dados do usuário e token.
         */
        login: async (email, password, tipo_usuario) => {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    tipo_usuario: tipo_usuario
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro desconhecido.');
            }
            return data;
        }
    };

    // --- LÓGICA DE UI (Event Listeners) ---
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            loginButton.disabled = true;
            loginButton.textContent = "Entrando...";
            loginError.style.display = 'none';

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const tipo_usuario = document.getElementById("account-type").value;

            try {
                // Chama a camada de serviço
                const data = await apiService.login(email, password, tipo_usuario);

                // Sucesso
                loginError.style.display = 'none';
                
                // Salva informações do usuário (simples)
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.nome);
                localStorage.setItem('userType', tipo_usuario);
                localStorage.setItem('token', data.token); // Salva o token

                // Redireciona para a página correta
                window.location.href = data.redirectTo;

            } catch (error) {
                // Erro
                console.error("Erro ao tentar fazer login:", error);
                loginError.querySelector('p').textContent = error.message || 'Não foi possível conectar ao servidor.';
                loginError.style.display = 'block';
                
                loginButton.disabled = false;
                loginButton.textContent = "Entrar";
            }
        });
    }
});

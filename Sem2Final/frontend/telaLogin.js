document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginButton = document.getElementById("login-button");
    const loginError = document.getElementById("login-error");

    // O objeto `window.apiService` é carregado pelo `apiService.js`
    if (!window.apiService) {
        console.error("apiService.js não foi carregado corretamente.");
        loginError.querySelector('p').textContent = 'Erro crítico ao carregar a página. Recarregue.';
        loginError.style.display = 'block';
        return;
    }

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
                // Chama o serviço global
                const data = await window.apiService.login(email, password, tipo_usuario);

                // Sucesso
                loginError.style.display = 'none';
                
                // Salva informações do usuário
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('userName', data.userName); 
                localStorage.setItem('userType', data.userType);
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


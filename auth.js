// Simulated Authentication System
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login');
    const signupForm = document.getElementById('signup');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;

            // Simple validation
            const users = JSON.parse(localStorage.getItem('sentinel_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('sentinel_session', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                alert('Invalid email or password. Hint: Use any account you created or "admin@sentinel.ai" / "admin123"');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = e.target.querySelector('input[type="text"]').value;
            const email = e.target.querySelector('input[type="email"]').value;
            const password = e.target.querySelector('input[type="password"]').value;

            const users = JSON.parse(localStorage.getItem('sentinel_users') || '[]');
            if (users.some(u => u.email === email)) {
                alert('User already exists!');
                return;
            }

            const newUser = { name, email, password, id: Date.now() };
            users.push(newUser);
            localStorage.setItem('sentinel_users', JSON.stringify(users));
            localStorage.setItem('sentinel_session', JSON.stringify(newUser));
            
            alert('Account created successfully!');
            window.location.href = 'dashboard.html';
        });
    }

    // Default admin account for easy testing
    const users = JSON.parse(localStorage.getItem('sentinel_users') || '[]');
    if (!users.some(u => u.email === 'admin@sentinel.ai')) {
        users.push({ name: 'Admin User', email: 'admin@sentinel.ai', password: 'admin123', id: 1 });
        localStorage.setItem('sentinel_users', JSON.stringify(users));
    }
});

const loginForm = document.getElementById('loginForm');
const registerBtn = document.getElementById('registerBtn');
const forgotPasswordLink = document.getElementById('forgotPassword');
const messageDiv = document.getElementById('message');

function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.className = isError ? 'message error' : 'message success';
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showMessage('Logowanie zakończone sukcesem!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        showMessage('Błąd: ' + error.message, true);
    }
});

registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Proszę uzupełnij email i hasło', true);
        return;
    }
    
    if (password.length < 6) {
        showMessage('Hasło musi mieć co najmniej 6 znaków', true);
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Konto utworzone pomyślnie!');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Error:', error);
        showMessage('Błąd: ' + error.message, true);
    }
});

forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    
    if (!email) {
        showMessage('Najpierw wprowadź swój email', true);
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Email z linkiem do resetowania hasła został wysłany. Sprawdź swoją skrzynkę odbiorczą.');
    } catch (error) {
        console.error('Error:', error);
        showMessage('Błąd: ' + error.message, true);
    }
});

auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});

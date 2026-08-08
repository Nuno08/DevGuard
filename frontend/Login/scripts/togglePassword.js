    document.addEventListener('DOMContentLoaded', () => {

    const togglePassword = document.getElementById('togglePassword');
    const togglePassword2 = document.getElementById('togglePassword2');

    const passwordInput = document.getElementById('password');
    const targetInput = document.getElementById('newPassword') || document.getElementById('confirmPassword');

    togglePassword.addEventListener('click', function () {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';

        this.classList.toggle('bi-eye');
        this.classList.toggle('bi-eye-slash');
    });

    togglePassword2.addEventListener('click', function () {
        const isPassword = targetInput.type === 'password';
        targetInput.type = isPassword ? 'text' : 'password';

        this.classList.toggle('bi-eye');
        this.classList.toggle('bi-eye-slash');
    });

});
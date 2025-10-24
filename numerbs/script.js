document.addEventListener('DOMContentLoaded', function() {
    const screen = document.getElementById('screen');
    const display = document.getElementById('display');
    let numbers = [];
    let currentColor = '#000000';
    let fontSize = 240;

    function renderDisplay() {
        display.innerHTML = numbers.map(item => `<span style="color: ${item.color};">${item.digit}</span>`).join('');
    }

    document.querySelectorAll('.number-btn').forEach(button => {
        button.addEventListener('click', function() {
            const number = this.getAttribute('data-number');
            numbers.push({ digit: number, color: currentColor });
            renderDisplay();
        });
    });

    document.getElementById('delete').addEventListener('click', function() {
        numbers.pop();
        renderDisplay();
    });

    document.getElementById('increase').addEventListener('click', function() {
        fontSize += 20;
        display.style.fontSize = fontSize + 'px';
    });

    document.getElementById('decrease').addEventListener('click', function() {
        if (fontSize > 20) {
            fontSize -= 20;
            display.style.fontSize = fontSize + 'px';
        }
    });

    document.getElementById('go').addEventListener('click', function() {
        display.classList.toggle('crazy');
    });

    document.getElementById('spin').addEventListener('click', function() {
        display.classList.toggle('spin');
    });

    document.querySelectorAll('.palette .color-circle').forEach(circle => {
        const color = circle.getAttribute('data-color');
        circle.style.backgroundColor = color;
        circle.addEventListener('click', function() {
            screen.style.backgroundColor = color;
        });
    });

    document.querySelectorAll('.number-palette .color-circle').forEach(circle => {
        const color = circle.getAttribute('data-color');
        circle.style.backgroundColor = color;
        circle.addEventListener('click', function() {
            currentColor = color;
        });
    });


});

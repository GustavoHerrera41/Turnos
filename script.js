document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointmentForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = {
            dni: formData.get('dni'),
            nombre: formData.get('nombre'),
            whatsapp: formData.get('whatsapp'),
            domicilio: formData.get('domicilio'),
            turno: formData.get('turno'),
            consulta: formData.get('consulta')
        };

        // Phone number provided in requirements (+5493813043498)
        const phoneNumber = '5493813043498';

        // Construct the message
        const message = `*Nueva Solicitud de Turno*%0A%0A` +
            `*Nombre:* ${data.nombre}%0A` +
            `*DNI:* ${data.dni}%0A` +
            `*WhatsApp:* ${data.whatsapp}%0A` +
            `*Domicilio:* ${data.domicilio}%0A` +
            `*Turno:* ${data.turno}%0A` +
            `*Motivo:* ${data.consulta}`;

        // Create WhatsApp link
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

        // Animation effect before redirect
        const button = form.querySelector('button');
        button.innerText = 'Redirigiendo...';
        button.style.background = '#e3f2fd';
        button.style.color = '#007bff';

        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            button.innerText = 'Confirmar y Enviar WhatsApp';
            button.style.background = '#ffffff';
            button.style.color = '#007bff';
        }, 1200);
    });

    // Simple interaction: Add class to inputs on focus to enhance style via JS if needed
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'translateX(5px)';
            input.parentElement.style.transition = 'transform 0.3s ease';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'translateX(0)';
        });
    });
});

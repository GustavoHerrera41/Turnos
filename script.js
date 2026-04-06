document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointmentForm');

    form.addEventListener('submit', async (e) => {
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

        // Supabase configuration
        const supabaseUrl = 'https://shuivcasusmplmkhmepi.supabase.co';
        const supabaseKey = 'sb_publishable_uS39ADcHSCt1lLdK-7XQ8w_1uTX3_qA';
        const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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

        // Animation effect
        const button = form.querySelector('button');
        const originalText = button.innerText;
        button.innerText = 'Guardando reserva...';
        button.disabled = true;

        // Save to Supabase and then redirect
        try {
            const { error: dbError } = await supabaseClient
                .from('turnos')
                .insert([{
                    dni: data.dni,
                    nombre: data.nombre,
                    whatsapp: data.whatsapp,
                    domicilio: data.domicilio,
                    turno: data.turno,
                    consulta: data.consulta
                }]);

            if (dbError) throw dbError;

            button.innerText = '¡Redirigiendo!';
            
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                button.innerText = originalText;
                button.disabled = false;
                form.reset();
            }, 1000);

        } catch (err) {
            console.error('Error al guardar:', err);
            alert('Hubo un problema al guardar tu turno en la base de datos. Por favor, intenta de nuevo.');
            button.innerText = originalText;
            button.disabled = false;
        }
    });

    // Interaction enhancement
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

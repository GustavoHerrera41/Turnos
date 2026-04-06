document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointmentForm');
    const adminPanel = document.getElementById('adminPanel');
    const adminTableBody = document.getElementById('adminTableBody');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const closeAdminBtn = document.getElementById('closeAdminBtn');

    // Supabase configuration
    const supabaseUrl = 'https://shuivcasusmplmkhmepi.supabase.co';
    const supabaseKey = 'sb_publishable_uS39ADcHSCt1lLdK-7XQ8w_1uTX3_qA';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // --- Calendar Initialization ---
    let calendar;
    const calendarEl = document.getElementById('calendar');

    const initCalendar = () => {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es', // Set to Spanish
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listWeek'
            },
            buttonText: {
                today: 'Hoy',
                month: 'Mes',
                list: 'Lista'
            },
            events: [],
            eventClick: function(info) {
                alert('Turno de: ' + info.event.title + '\nHorario: ' + info.event.extendedProps.horario);
            }
        });
        calendar.render();
    };

    const loadEvents = async () => {
        const { data, error } = await supabaseClient
            .from('turnos')
            .select('*');

        if (error) {
            console.error('Error fetching events:', error);
            return;
        }

        const events = data.map(item => {
            // item.turno is like "08:30 a 09:30"
            const times = item.turno.split(' a ');
            const startStr = times[0];
            const endStr = times[1];
            
            return {
                title: 'Ocupado',
                start: `${item.fecha}T${startStr}:00`,
                end: `${item.fecha}T${endStr}:00`,
                extendedProps: { horario: item.turno },
                allDay: false
            };
        });

        calendar.removeAllEvents();
        calendar.addEventSource(events);
        
        // If admin panel is open, refresh table too
        if (!adminPanel.classList.contains('hidden')) {
            renderAdminTable(data);
        }
    };

    // --- Form Handling ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            dni: formData.get('dni'),
            nombre: formData.get('nombre'),
            whatsapp: formData.get('whatsapp'),
            domicilio: formData.get('domicilio'),
            fecha: formData.get('fecha'),
            turno: formData.get('turno'),
            consulta: formData.get('consulta')
        };

        const button = form.querySelector('button');
        const originalText = button.innerText;
        button.innerText = 'Validando ocupación...';
        button.disabled = true;

        try {
            // 1. Check if the slot is already taken
            const { data: existing, error: checkError } = await supabaseClient
                .from('turnos')
                .select('id')
                .eq('fecha', data.fecha)
                .eq('turno', data.turno);

            if (checkError) throw checkError;

            if (existing && existing.length > 0) {
                alert('Lo sentimos, este horario ya está reservado para esa fecha. Por favor, elige otro día u otra hora.');
                button.innerText = originalText;
                button.disabled = false;
                return;
            }

            button.innerText = 'Guardando reserva...';

            // 2. Save to Supabase
            const { error: dbError } = await supabaseClient
                .from('turnos')
                .insert([{
                    dni: data.dni,
                    nombre: data.nombre,
                    whatsapp: data.whatsapp,
                    domicilio: data.domicilio,
                    fecha: data.fecha,
                    turno: data.turno,
                    consulta: data.consulta
                }]);

            if (dbError) throw dbError;

            // 3. Construct WhatsApp Message (Including Date)
            const phoneNumber = '5493813043498';
            const formattedDate = new Date(data.fecha + 'T00:00:00').toLocaleDateString('es-ES', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            
            const message = `*Nueva Solicitud de Turno*%0A%0A` +
                `*Nombre:* ${data.nombre}%0A` +
                `*Fecha:* ${formattedDate}%0A` +
                `*Turno:* ${data.turno}%0A` +
                `*DNI:* ${data.dni}%0A` +
                `*WhatsApp:* ${data.whatsapp}%0A` +
                `*Domicilio:* ${data.domicilio}%0A` +
                `*Motivo:* ${data.consulta}`;

            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

            loadEvents();
            button.innerText = '¡Redirigiendo!';
            
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                button.innerText = originalText;
                button.disabled = false;
                form.reset();
            }, 1000);

        } catch (err) {
            console.error('Error:', err);
            alert('Hubo un problema. Intenta de nuevo.');
            button.innerText = originalText;
            button.disabled = false;
        }
    });

    // --- Admin Management ---
    adminLoginBtn.addEventListener('click', () => {
        const pass = prompt('Ingresa la contraseña de administrador:');
        if (pass === 'admin123') {
            adminPanel.classList.remove('hidden');
            loadEvents(); // This will also trigger renderAdminTable
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Contraseña incorrecta.');
        }
    });

    closeAdminBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });

    const renderAdminTable = (turnos) => {
        adminTableBody.innerHTML = '';
        // Sort by date and turn
        turnos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        turnos.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${t.fecha}</td>
                <td>${t.turno}</td>
                <td>${t.nombre}</td>
                <td>${t.whatsapp}</td>
                <td>
                    <button class="delete-btn" onclick="deleteTurno('${t.id}')">Borrar</button>
                </td>
            `;
            adminTableBody.appendChild(row);
        });
    };

    window.deleteTurno = async (id) => {
        if (confirm('¿Estás seguro de que deseas borrar este turno?')) {
            const { error } = await supabaseClient
                .from('turnos')
                .delete()
                .eq('id', id);

            if (error) {
                alert('No se pudo borrar el turno.');
            } else {
                loadEvents();
            }
        }
    };

    // --- UI Interactions ---
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'translateX(5px)';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'translateX(0)';
        });
    });

    initCalendar();
    loadEvents();

    // --- Dynamic Slot Availability ---
    const fechaInput = document.getElementById('fecha');
    const turnoSelect = document.getElementById('turno');
    const turnoOptions = turnoSelect.querySelectorAll('option:not([value=""])');
    
    // Disable turno until date is chosen
    turnoSelect.disabled = true;

    fechaInput.addEventListener('change', async () => {
        const selectedDate = fechaInput.value;
        if (!selectedDate) {
            turnoSelect.disabled = true;
            return;
        }

        turnoSelect.disabled = true;
        const originalLabel = turnoSelect.previousElementSibling.innerText;
        turnoSelect.previousElementSibling.innerText = 'Cargando disponibilidad...';

        try {
            const { data: booked, error } = await supabaseClient
                .from('turnos')
                .select('turno')
                .eq('fecha', selectedDate);

            if (error) throw error;

            const bookedTurnos = booked.map(b => b.turno);

            turnoOptions.forEach(opt => {
                if (bookedTurnos.includes(opt.value)) {
                    opt.disabled = true;
                    opt.innerText = opt.value + ' (Ocupado)';
                } else {
                    opt.disabled = false;
                    opt.innerText = opt.value;
                }
            });

            // If current selection is now disabled, reset it
            if (turnoSelect.selectedOptions[0]?.disabled) {
                turnoSelect.value = "";
            }

            turnoSelect.disabled = false;
            turnoSelect.previousElementSibling.innerText = 'Horario de Turno (Actualizado)';
            setTimeout(() => {
                turnoSelect.previousElementSibling.innerText = 'Horario de Turno';
            }, 2000);

        } catch (err) {
            console.error('Error al cargar disponibilidad:', err);
            turnoSelect.disabled = false;
            turnoSelect.previousElementSibling.innerText = 'Horario de Turno';
        }
    });
});

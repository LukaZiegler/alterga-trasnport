const logoutBtn = document.getElementById('logoutBtn');
const userEmailSpan = document.getElementById('userEmail');
const addVehicleBtn = document.getElementById('addVehicleBtn');
const vehicleModal = document.getElementById('vehicleModal');
const vehicleForm = document.getElementById('vehicleForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const navTabs = document.querySelectorAll('.nav-tab');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const selectAllCheckbox = document.getElementById('selectAll');
const vehicleFilter = document.getElementById('vehicleFilter');

const backToVehiclesBtn = document.getElementById('backToVehiclesBtn');
const exportVehiclePdfBtn = document.getElementById('exportVehiclePdfBtn');
const vehicleImageInput = document.getElementById('vehicleImage');
const imagePreview = document.getElementById('imagePreview');
const viewToggleBtn = document.getElementById('viewToggleBtn');

let currentEditVehicleId = null;
let currentUser = null;
let currentVehicleDetail = null;
let selectedImageFile = null;
let isCardView = true;
let issuesListener = null;

// Authentication
let authListenerCount = 0;
auth.onAuthStateChanged((user) => {
    authListenerCount++;
    console.log(`🔐 Auth listener ejecutado #${authListenerCount}`);

    if (user) {
        console.log('👤 Usuario autenticado:', user.email);
        currentUser = user;
        userEmailSpan.textContent = user.email;
        setupVehiclesListener();
        setupRefuelsListener();
        setupTripsListener();
        setupAssignmentsListener();
        setupTransfersListener();
        setupIssuesListener();
    } else {
        console.log('🚪 Usuario no autenticado, redirigiendo...');
        // Limpiar estado
        isVehiclesListenerActive = false;
        if (vehiclesListener) {
            vehiclesListener();
            vehiclesListener = null;
        }
        window.location.href = 'index.html';
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Błąd podczas wylogowywania:', error);
    }
});

// Navigation
navTabs.forEach(tab => {
tab.addEventListener('click', () => {
const viewName = tab.dataset.view;

// Update active tab
navTabs.forEach(t => t.classList.remove('active'));
tab.classList.add('active');

// Update active view
document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
document.getElementById(viewName + 'View').classList.add('active');

        // Load data for specific views
        if (viewName === 'assignments') {
            loadAssignments();
        }
        if (viewName === 'transfers') {
        loadTransfers();
        }
        if (viewName === 'issues') {
            loadIssues();
        }
    });
});

// Modal Controls
addVehicleBtn.addEventListener('click', () => {
    openModal();
});

closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === vehicleModal) {
        closeModal();
    }
});

// Show/hide driver name field based on status
document.getElementById('status').addEventListener('change', (e) => {
    const driverGroup = document.getElementById('driverNameGroup');
    if (e.target.value === 'occupied') {
        driverGroup.style.display = 'block';
    } else {
        driverGroup.style.display = 'none';
    }
});

// Update fuel details based on selected fuels
function updateFuelDetails() {
    const selectedFuels = [];
    if (document.getElementById('fuelGasolina').checked) selectedFuels.push('Gasolina');
    if (document.getElementById('fuelDiesel').checked) selectedFuels.push('Diesel');
    if (document.getElementById('fuelGas').checked) selectedFuels.push('Gas');

    const dualDetails = document.getElementById('dualFuelDetails');
    const singleCapacity = document.getElementById('fuelCapacity').parentElement;
    const singleCurrent = document.getElementById('currentFuel').parentElement;

    if (selectedFuels.length === 2) {
        dualDetails.style.display = 'block';
        singleCapacity.style.display = 'none';
        singleCurrent.style.display = 'none';

        document.getElementById('tank1Label').textContent = `Tanque ${selectedFuels[0]}`;
        document.getElementById('tank2Label').textContent = `Tanque ${selectedFuels[1]}`;

        // Set required for dual fields
        document.getElementById('fuelCapacity1').required = true;
        document.getElementById('currentFuel1').required = true;
        document.getElementById('fuelCapacity2').required = true;
        document.getElementById('currentFuel2').required = true;

        // Remove required from single
        document.getElementById('currentFuel').required = false;
        document.getElementById('fuelCapacity').required = false;
    } else {
        dualDetails.style.display = 'none';
        singleCapacity.style.display = 'block';
        singleCurrent.style.display = 'block';

        // Set required for single fields
        document.getElementById('currentFuel').required = true;
        document.getElementById('fuelCapacity').required = false; // capacity optional

        // Remove required from dual
        document.getElementById('fuelCapacity1').required = false;
        document.getElementById('currentFuel1').required = false;
        document.getElementById('fuelCapacity2').required = false;
        document.getElementById('currentFuel2').required = false;
    }
}

// Add event listeners for fuel checkboxes
document.getElementById('fuelGasolina').addEventListener('change', updateFuelDetails);
document.getElementById('fuelDiesel').addEventListener('change', updateFuelDetails);
document.getElementById('fuelGas').addEventListener('change', updateFuelDetails);

// Image preview
vehicleImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

function openModal(vehicleId = null) {
    currentEditVehicleId = vehicleId;
    
    if (vehicleId) {
        modalTitle.textContent = 'Edytuj Pojazd';
        loadVehicleData(vehicleId);
    } else {
        modalTitle.textContent = 'Dodaj Pojazd';
        vehicleForm.reset();
    }
    
    vehicleModal.classList.add('active');
}

function closeModal() {
    vehicleModal.classList.remove('active');
    vehicleForm.reset();
    currentEditVehicleId = null;
    selectedImageFile = null;
    imagePreview.innerHTML = '';

    // Clear dual fuel fields
    document.getElementById('fuelCapacity1').value = '';
    document.getElementById('currentFuel1').value = '';
    document.getElementById('fuelCapacity2').value = '';
    document.getElementById('currentFuel2').value = '';
    document.getElementById('dualFuelDetails').style.display = 'none';
}

async function loadVehicleData(vehicleId) {
    try {
        const doc = await db.collection('vehicles').doc(vehicleId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('registration').value = data.registration;
            document.getElementById('model').value = data.model;
            document.getElementById('brand').value = data.brand;
            document.getElementById('year').value = data.year || '';
            document.getElementById('currentKm').value = data.currentKm;
            document.getElementById('currentFuel').value = data.currentFuel;
            document.getElementById('fuelCapacity').value = data.fuelCapacity || '';
            document.getElementById('tireType').value = data.tireType || 'summer';
            document.getElementById('lastServiceKm').value = data.lastServiceKm || '';
            document.getElementById('fuelNorm').value = data.fuelNorm || '';
            document.getElementById('vehicleNumber').value = data.vehicleNumber || '';
            document.getElementById('dateFrom').value = data.dateFrom || '';
            document.getElementById('dateTo').value = data.dateTo || '';
            document.getElementById('status').value = data.status || 'available';
            document.getElementById('currentDriverName').value = data.currentDriver || '';

            // Cargar tipos de combustible
            const fuelTypes = data.fuelTypes || ['Gasolina'];
            document.getElementById('fuelGasolina').checked = fuelTypes.includes('Gasolina');
            document.getElementById('fuelDiesel').checked = fuelTypes.includes('Diesel');
            document.getElementById('fuelGas').checked = fuelTypes.includes('Gas');

            // Update fuel details display
            updateFuelDetails();

            // Cargar capacidades y litros actuales
            if (fuelTypes.length === 2) {
                const fuelCapacities = data.fuelCapacities || [];
                const currentFuels = data.currentFuels || [];
                document.getElementById('fuelCapacity1').value = fuelCapacities[0] || '';
                document.getElementById('currentFuel1').value = currentFuels[0] || '';
                document.getElementById('fuelCapacity2').value = fuelCapacities[1] || '';
                document.getElementById('currentFuel2').value = currentFuels[1] || '';
            } else {
                document.getElementById('currentFuel').value = data.currentFuel || '';
                document.getElementById('fuelCapacity').value = data.fuelCapacity || '';
            }
            
            // Show current image preview
            if (data.imageUrl) {
                imagePreview.innerHTML = `<img src="${data.imageUrl}" alt="Current image">`;
            }
            
            // Show/hide driver field
            const driverGroup = document.getElementById('driverNameGroup');
            if (data.status === 'occupied') {
                driverGroup.style.display = 'block';
            } else {
                driverGroup.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Błąd podczas ładowania pojazdu:', error);
    }
}

// Vehicle CRUD
vehicleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('💾 Guardando vehículo...', currentEditVehicleId ? 'Editando:' + currentEditVehicleId : 'Creando nuevo');

    // Validar tipos de combustible
    const selectedFuels = [];
    if (document.getElementById('fuelGasolina').checked) selectedFuels.push('Gasolina');
    if (document.getElementById('fuelDiesel').checked) selectedFuels.push('Diesel');
    if (document.getElementById('fuelGas').checked) selectedFuels.push('Gas');

    if (selectedFuels.length === 0) {
        alert('Debes seleccionar al menos un tipo de combustible');
        return;
    }

    if (selectedFuels.length > 2) {
        alert('Puedes seleccionar máximo 2 tipos de combustible');
        return;
    }

    // Validar combinaciones permitidas
    if (selectedFuels.length === 2) {
        const invalidCombo = selectedFuels.includes('Gasolina') && selectedFuels.includes('Diesel');
        if (invalidCombo) {
            alert('No se permite la combinación Gasolina + Diesel. Usa Gasolina + Gas o Diesel + Gas.');
            return;
        }
    }

    try {
        let imageUrl = '';
        
        // Upload image if selected
        if (selectedImageFile) {
            try {
                const storageRef = storage.ref();
                const fileName = `vehicles/${currentUser.uid}/${Date.now()}_${selectedImageFile.name}`;
                const imageRef = storageRef.child(fileName);
                
                await imageRef.put(selectedImageFile);
                imageUrl = await imageRef.getDownloadURL();
            } catch (uploadError) {
                console.error('Błąd podczas wysyłania obrazu:', uploadError);
                alert('⚠️ Błąd wysyłania obrazu. Firebase Storage nie jest skonfigurowany. Pojazd zostanie zapisany bez osobistego obrazu.');
            }
        } else if (currentEditVehicleId) {
            const doc = await db.collection('vehicles').doc(currentEditVehicleId).get();
            imageUrl = doc.data().imageUrl || '';
        }
        
        let currentFuel, fuelCapacity, fuelCapacities, currentFuels;
        if (selectedFuels.length === 2) {
            fuelCapacities = [
                parseFloat(document.getElementById('fuelCapacity1').value) || null,
                parseFloat(document.getElementById('fuelCapacity2').value) || null
            ];
            currentFuels = [
                parseFloat(document.getElementById('currentFuel1').value) || 0,
                parseFloat(document.getElementById('currentFuel2').value) || 0
            ];
            currentFuel = null; // Not used for dual
            fuelCapacity = null;
        } else {
            currentFuel = parseFloat(document.getElementById('currentFuel').value);
            fuelCapacity = parseFloat(document.getElementById('fuelCapacity').value) || null;
            fuelCapacities = null;
            currentFuels = null;
        }

        const vehicleData = {
            registration: document.getElementById('registration').value,
            model: document.getElementById('model').value,
            brand: document.getElementById('brand').value,
            year: parseInt(document.getElementById('year').value) || null,
            currentKm: parseFloat(document.getElementById('currentKm').value),
            currentFuel: currentFuel,
            fuelCapacity: fuelCapacity,
            fuelCapacities: fuelCapacities,
            currentFuels: currentFuels,
            tireType: document.getElementById('tireType').value,
            lastServiceKm: parseFloat(document.getElementById('lastServiceKm').value) || 0,
            fuelNorm: parseFloat(document.getElementById('fuelNorm').value) || null,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            status: document.getElementById('status').value,
            fuelTypes: selectedFuels,
            currentDriver: document.getElementById('status').value === 'occupied'
                ? document.getElementById('currentDriverName').value
                : null,
            imageUrl: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentEditVehicleId) {
            await db.collection('vehicles').doc(currentEditVehicleId).update(vehicleData);
        } else {
            vehicleData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            vehicleData.userId = currentUser.uid;
            await db.collection('vehicles').add(vehicleData);
        }
        
        console.log('✅ Vehículo guardado correctamente:', currentEditVehicleId || 'Nuevo vehículo');
        closeModal();
        // No llamamos loadVehicles() - el listener actualiza automáticamente
    } catch (error) {
        console.error('❌ Error al guardar vehículo:', error);
        alert('Błąd podczas zapisywania pojazdu: ' + error.message);
    }
});

// Fuel gauge images
const fuelIcons = {
full: `<img src="fuel90.png" style="width: 100px; height: 100px; object-fit: contain;" alt="Fuel level">`,
half: `<img src="fuel50.png" style="width: 100px; height: 100px; object-fit: contain;" alt="Fuel level">`,
low: `<img src="fuel30.png" style="width: 100px; height: 100px; object-fit: contain;" alt="Fuel level">`
};

function getFuelIcon(percentage) {
    if (percentage >= 90) return fuelIcons.full;
    if (percentage >= 50) return fuelIcons.half;
    return fuelIcons.low;
}

// Real-time listener for vehicles
let vehiclesListener = null;
let isVehiclesListenerActive = false;

// Listener for fuel refills
let refuelsListener = null;

// Listener for assignments
let assignmentsListener = null;

function setupVehiclesListener() {
    // Evitar configurar múltiples listeners
    if (isVehiclesListenerActive) {
        return;
    }

    // Limpiar listener anterior si existe
    if (vehiclesListener) {
        vehiclesListener();
        vehiclesListener = null;
    }

    isVehiclesListenerActive = true;

    vehiclesListener = db.collection('vehicles')
        .where('userId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            const changes = snapshot.docChanges();
                // Verificar si todos los cambios son "added" (primera carga)
            const allAdded = changes.length > 0 && changes.every(change => change.type === 'added');
            if (allAdded && changes.length > 1) {
                renderVehicles(snapshot);
                return;
            }

            // Solo renderizar si hay cambios reales (no primera carga masiva)
            if (changes.length > 0) {
                renderVehicles(snapshot);
            }
        }, (error) => {
            console.error('❌ Error en listener de vehículos:', error);
            isVehiclesListenerActive = false;
        });
}

// Listener for fuel refills
function setupRefuelsListener() {
refuelsListener = db.collection('refuels')
.where('userId', '==', currentUser.uid)
.where('reportedAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Últimas 24 horas
.orderBy('reportedAt', 'desc')
.onSnapshot((snapshot) => {
snapshot.docChanges().forEach(change => {
if (change.type === 'added') {
const refuel = change.doc.data();
showRefuelNotification(refuel);
updateVehicleFuel(refuel);
}
});
}, (error) => {
console.error('Error en listener de recargas:', error);
});
}

// Listener for assignments
function setupAssignmentsListener() {
    assignmentsListener = db.collection('authorizations')
        .where('userId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            // Listener active, but reload only on view change to avoid duplicates
        }, (error) => {
            console.error('Error en listener de asignaciones:', error);
        });
}

// Listener for transfers
let transfersListener = null;
function setupTransfersListener() {
    transfersListener = db.collection('transfers')
        .where('fromUserId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            // Reload transfers if transfers view is active
            const activeView = document.querySelector('.view.active');
            if (activeView && activeView.id === 'transfersView') {
                loadTransfers();
            }
        }, (error) => {
            console.error('Error en listener de transferencias:', error);
        });
}

// Update vehicle fuel after refuel
async function updateVehicleFuel(refuel) {
    try {
        const vehicleDoc = await db.collection('vehicles').doc(refuel.vehicleId).get();
        if (!vehicleDoc.exists) return;

        const vehicle = vehicleDoc.data();
        const fuelTypes = vehicle.fuelTypes || ['Gasolina'];
        const liters = refuel.liters || 0;
        const fuelType = refuel.fuelType;

        if (fuelTypes.length === 1) {
            // Single fuel
            if (fuelTypes[0] === fuelType) {
                const capacity = vehicle.fuelCapacity || 80;
                const newFuel = Math.min((vehicle.currentFuel || 0) + liters, capacity);
                await db.collection('vehicles').doc(refuel.vehicleId).update({
                    currentFuel: newFuel,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            // Dual fuel
            const index = fuelTypes.indexOf(fuelType);
            if (index !== -1) {
                const fuelCapacities = vehicle.fuelCapacities || [80, 80];
                const currentFuels = vehicle.currentFuels || [0, 0];
                currentFuels[index] = Math.min(currentFuels[index] + liters, fuelCapacities[index]);
                await db.collection('vehicles').doc(refuel.vehicleId).update({
                    currentFuels: currentFuels,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (error) {
        console.error('Error updating vehicle fuel:', error);
    }
}

// Mostrar notificación de recarga de combustible
function showRefuelNotification(refuel) {

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'refuel-notification';
    notification.innerHTML = `
        <div class="refuel-icon">⛽</div>
        <div class="refuel-text">
            <strong>${refuel.driverName}</strong> está recargando combustible<br>
            <small>${refuel.liters}L de ${refuel.fuelType}</small>
        </div>
    `;

    // Agregar al DOM
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => notification.classList.add('visible'), 100);

    // Ocultar después de 2 minutos
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 120000); // 2 minutos
}

// Obtener el último reporte de avería de un vehículo
async function getLatestIssue(vehicleId) {
    try {
        const snapshot = await db.collection('issues')
            .where('vehicleId', '==', vehicleId)
            .orderBy('reportedAt', 'desc')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return snapshot.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo reporte de avería:', error);
        return null;
    }
}

async function renderVehicles(snapshot) {
try {
const vehiclesGrid = document.getElementById('vehiclesGrid');
        const vehicleFilterSelect = document.getElementById('vehicleFilter');

// Limpiar completamente antes de renderizar
        vehiclesGrid.innerHTML = '';

if (snapshot.empty) {
    vehiclesGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-state-icon">🚗</div>
                <h3>Nie ma zarejestrowanych pojazdów</h3>
                <p>Zacznij od dodania pierwszego pojazdu do floty</p>
            </div>
        `;
return;
}

vehicleFilterSelect.innerHTML = '<option value="">Wszystkie pojazdy</option>';

// Procesar vehículos y obtener reportes de avería si es necesario
const vehiclePromises = snapshot.docs.map(async (doc) => {
const vehicle = doc.data();
const vehicleId = doc.id;

// Add to filter
const option = document.createElement('option');
option.value = vehicleId;
option.textContent = `${vehicle.brand} ${vehicle.model} - ${vehicle.registration}`;
vehicleFilterSelect.appendChild(option);

// Calcular próximo servicio (cada 10,000 km absolutos)
const nextService = Math.floor(vehicle.currentKm / 10000) * 10000 + 10000;
const kmUntilService = nextService - vehicle.currentKm;
const needsService = false; // Siempre mostrar km restantes

            const fuelTypes = vehicle.fuelTypes || ['Gasolina'];

            // Calcular estado del combustible
            let fuelInfo = '';
            let fuelStatusClass = 'low';
            let avgFuelPercentage = 0;
            if (fuelTypes.length === 2) {
                const fuelCapacities = vehicle.fuelCapacities || [80, 80];
                const currentFuels = vehicle.currentFuels || [0, 0];
                const percentages = fuelCapacities.map((cap, i) => ((currentFuels[i] / cap) * 100));
                fuelInfo = `${fuelTypes[0]}: ${Math.round(percentages[0])}% | ${fuelTypes[1]}: ${Math.round(percentages[1])}%`;
                // Use average for color
                avgFuelPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;
                if (avgFuelPercentage >= 75) fuelStatusClass = 'full';
                else if (avgFuelPercentage >= 25) fuelStatusClass = 'medium';
            } else {
                const fuelCapacity = vehicle.fuelCapacity || 80;
                const currentFuel = vehicle.currentFuel || 0;
                avgFuelPercentage = (currentFuel / fuelCapacity) * 100;
                fuelInfo = `${Math.round(avgFuelPercentage)}%`;
                if (avgFuelPercentage >= 75) fuelStatusClass = 'full';
                else if (avgFuelPercentage >= 25) fuelStatusClass = 'medium';
            }

// Obtener estado del vehículo
let status = vehicle.status || 'available';
let statusIcon = '';
let statusText = '';
let statusClass = status;
            let issueTooltip = '';

// 🔧 Detectar si tiene avería leve
            const hasMinorIssue = vehicle.status === 'minor_issue';
const hasIssue = hasMinorIssue || vehicle.status === 'broken';

// Si tiene avería, obtener el último reporte
if (hasIssue) {
const latestIssue = await getLatestIssue(vehicleId);
if (latestIssue) {
const issueType = latestIssue.issueType === 'leve' ? 'Avería Leve' : 'Avería Grave';
const date = new Date(latestIssue.dateTime).toLocaleDateString('es-ES');
const driver = latestIssue.driverName || 'Conductor desconocido';
                    issueTooltip = `${issueType}
Reportado por: ${driver}
Fecha: ${date}
Descripción: ${latestIssue.description}`;
                }
            }

// Detectar si tiene avería para mostrar tooltip

// Si tiene avería leve, pero también está ocupado o disponible, mantenemos el color original
if (hasMinorIssue) {
// Conserva el estado real (occupied o available)
status = vehicle.currentDriver ? 'occupied' : 'available';
}

if (status === 'broken') {
    statusIcon = '🔴';
statusText = 'USZKODZONY';
statusClass = 'broken';
} else if (status === 'occupied') {
    statusIcon = '🔵';
                statusText = vehicle.currentDriver || 'Zajęty';
    statusClass = 'occupied';
} else {
    statusIcon = '✅';
    statusText = 'Dostępny';
    statusClass = 'available';
}

// Si tiene avería leve, cambia el color y añade ícono más visible
if (hasMinorIssue) {
    statusIcon = '🔧'; // Solo el ícono de reparación
    statusText += ' (Avería)'; // Agrega texto explicativo
    statusClass = 'minor_issue'; // Usa clase especial con color amarillo
}


// Icono de neumático
const tireIcon = vehicle.tireType === 'winter' ? '❄️' : '☀️';
const tireText = vehicle.tireType === 'winter' ? 'Zima' : 'Lato';

// Badge de llaves
const keysDelivered = vehicle.keysDelivered || false;
const keysDeliveredTo = vehicle.keysDeliveredTo || '';

// Create vehicle card
            const card = document.createElement('div');
            card.className = 'vehicle-card clickable';
card.onclick = () => showVehicleDetail(vehicleId);

let badgeHtml;
if (issueTooltip) {
                badgeHtml = `<div class="tooltip-container">
                    <div class="vehicle-status-badge ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                    <div class="tooltip-text">${issueTooltip}</div>
            </div>`;
            } else {
                badgeHtml = `<div class="vehicle-status-badge ${statusClass}">
                    ${statusIcon} ${statusText}
                </div>`;
}

            card.innerHTML = `
                ${badgeHtml}
${needsService ? '<div class="service-alert">⚠️ Serwis wymagany</div>' : ''}
<div class="vehicle-image">
${vehicle.imageUrl
    ? `<img src="${vehicle.imageUrl}" alt="${vehicle.model}">`
: `<img src="car_default.png" alt="${vehicle.model}">`
}
</div>
${keysDelivered ? `
<div class="keys-badge-inline">
<span class="keys-icon">🔑</span>
<span class="keys-text">Klucze przekazane do <strong>${keysDeliveredTo}</strong></span>
</div>
` : ''}
<div class="vehicle-info">
<h3>${vehicle.brand} ${vehicle.model}</h3>
<div class="vehicle-registration">${vehicle.registration}</div>

<div class="vehicle-stats">
<div class="stat">
<div class="stat-label">📍 Przebieg</div>
    <div class="stat-value">${vehicle.currentKm.toLocaleString()} km</div>
</div>
<div class="stat">
<div class="stat-label">⛽ Średnie spalanie</div>
<div class="stat-value">${vehicle.fuelNorm || 'N/A'} L/100 km</div>
</div>
<div class="stat">
<div class="stat-label">${tireIcon} Opony</div>
<div class="stat-value">${tireText}</div>
</div>
<div class="stat">
<div class="stat-label">🔧 Następny Serwis</div>
<div class="stat-value">${kmUntilService.toLocaleString()} km</div>
</div>
        </div>
</div>

            <div class="vehicle-actions" style="display: flex; justify-content: space-between; align-items: center;">
            <button class="btn-edit" onclick="event.stopPropagation(); editVehicle('${vehicleId}')">Edytuj</button>
            ${getFuelIcon(avgFuelPercentage)}
            ${keysDelivered
            ? `<button class="btn-keys" onclick="event.stopPropagation(); returnKeys('${vehicleId}')">Klucze Zwrócone</button>`
            : ''
            }
                <button class="btn-delete" onclick="event.stopPropagation(); deleteVehicle('${vehicleId}', '${vehicle.registration}')">Usuń</button>
                    </div>
                </div>
            `;

            vehiclesGrid.appendChild(card);
        });

        // Esperar a que todas las promesas se resuelvan
        await Promise.all(vehiclePromises);

    } catch (error) {
        console.error('Error durante renderizado de vehículos:', error);
    }
}

// Backward compatibility - called when editing
async function loadVehicles() {
    // No hace nada - el listener maneja todo
}

function editVehicle(vehicleId) {
    console.log('✏️ Editando vehículo:', vehicleId);
    openModal(vehicleId);
}

async function deleteVehicle(vehicleId, registration) {
    if (confirm(`Czy na pewno chcesz usunąć pojazd ${registration}?`)) {
        try {
            await db.collection('vehicles').doc(vehicleId).delete();
            // No llamamos loadVehicles() - el listener actualiza automáticamente
        } catch (error) {
            console.error('Błąd podczas usuwania pojazdu:', error);
            alert('Błąd podczas usuwania pojazdu');
        }
    }
}

// Trips / Registros
// Real-time listener for trips
let tripsListener = null;

function setupTripsListener() {
    loadTripsRealtime();
}

function loadTripsRealtime() {
    if (tripsListener) {
        tripsListener();
    }
    
    const vehicleId = vehicleFilter.value;
    let query = db.collection('trips').where('userId', '==', currentUser.uid);
    
    if (vehicleId) {
        query = query.where('vehicleId', '==', vehicleId);
    }
    
    tripsListener = query.limit(100).onSnapshot((snapshot) => {
        renderTrips(snapshot);
    }, (error) => {
    console.error('Błąd w słuchaczu podróży:', error);
    });
}

async function renderTrips(snapshot) {
    try {
        if (isCardView) {
            await renderTripsCards(snapshot);
        } else {
            await renderTripsTable(snapshot);
        }
    } catch (error) {
        console.error('Error renderizando viajes:', error);
    }
}

async function renderTripsCards(snapshot) {
    const container = document.getElementById('tripsCardsView');
    
    if (snapshot.empty) {
        container.innerHTML = `
        <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>Brak rejestracji podróży</h3>
        <p>Podróże pojawią się tutaj, gdy kierowcy będą używać aplikacji</p>
        </div>
        `;
        return;
    }
    
    // Group trips by date
    const tripsByDate = {};
    
    for (const doc of snapshot.docs) {
        const trip = doc.data();
        const date = trip.date ? trip.date.toDate() : new Date();
        const dateKey = date.toLocaleDateString('pl-PL');
        
        if (!tripsByDate[dateKey]) {
            tripsByDate[dateKey] = [];
        }
        
        // Get vehicle info
        let vehicleInfo = { brand: '', model: '', registration: '', imageUrl: '' };
        if (trip.vehicleId) {
            const vehicleDoc = await db.collection('vehicles').doc(trip.vehicleId).get();
            if (vehicleDoc.exists) {
                const v = vehicleDoc.data();
                vehicleInfo = {
                    brand: v.brand,
                    model: v.model,
                    registration: v.registration,
                    imageUrl: v.imageUrl
                };
            }
        }
        
        tripsByDate[dateKey].push({ ...trip, id: doc.id, vehicle: vehicleInfo });
    }
    
    // Generate HTML
    let html = '';
    
    Object.keys(tripsByDate).sort().reverse().forEach(dateKey => {
        const trips = tripsByDate[dateKey];
        
        html += `
            <div class="timeline-day">
                <div class="timeline-date">
                    <span class="timeline-date-icon">📅</span>
                    <span class="timeline-date-text">${dateKey}</span>
                    <span class="timeline-date-count">${trips.length} viaje${trips.length > 1 ? 's' : ''}</span>
                </div>
                
                <div class="trips-cards-grid">
        `;
        
        trips.forEach(trip => {
            const kmTraveled = trip.kmEnd - trip.kmStart;
            const consumption = kmTraveled > 0 ? ((trip.fuelUsed / kmTraveled) * 100).toFixed(2) : '0.00';
            
            html += `
                <div class="trip-card">
                    <div class="trip-card-header">
                        <div class="trip-card-driver">
                            <div class="driver-avatar">${trip.driverName?.charAt(0) || 'C'}</div>
                            <div>
                                <div class="driver-name">${trip.driverName || 'Bez kierowcy'}</div>
                                <div class="trip-time">${trip.hourStart || '-'} → ${trip.hourEnd || '-'}</div>
                            </div>
                        </div>
                        <div class="trip-card-vehicle">
                            ${trip.vehicle.imageUrl 
                                ? `<img src="${trip.vehicle.imageUrl}" alt="Vehículo">` 
                                : `<img src="car_default.png" alt="Vehículo">`
                            }
                            <div class="vehicle-name">${trip.vehicle.brand} ${trip.vehicle.model}</div>
                            <div class="vehicle-reg">${trip.vehicle.registration}</div>
                        </div>
                    </div>
                    
                    <div class="trip-card-stats">
                        <div class="trip-stat">
                            <div class="trip-stat-icon">📍</div>
                            <div>
                                <div class="trip-stat-label">Przebyta odległość</div>
                                <div class="trip-stat-value">${kmTraveled.toLocaleString()} km</div>
                                <div class="trip-stat-detail">${trip.kmStart.toLocaleString()} → ${trip.kmEnd.toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div class="trip-stat">
                            <div class="trip-stat-icon"><img src="gasoline-level.png" class="fuel-icon"></div>
                            <div>
                                <div class="trip-stat-label">Paliwo</div>
                                <div class="trip-stat-value">${trip.fuelUsed?.toFixed(1) || '-'} L</div>
                                <div class="trip-stat-detail">Zużycie: ${consumption} L/100km</div>
                            </div>
                        </div>
                        
                        ${trip.refuelLiters ? `
                        <div class="trip-stat refuel-stat">
                            <div class="trip-stat-icon">⛽</div>
                            <div>
                                <div class="trip-stat-label">Repostaje</div>
                                <div class="trip-stat-value">${trip.refuelLiters} L</div>
                                <div class="trip-stat-detail">${trip.fuelType || 'diesel'}</div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${(trip.originCity || trip.destinationCity) ? `
                        <div class="trip-stat">
                            <div class="trip-stat-icon">🗺️</div>
                            <div>
                                <div class="trip-stat-label">Ruta</div>
                                <div class="trip-stat-value">${trip.originCity || '?'} → ${trip.destinationCity || '?'}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${(trip.oilAdded || trip.washerFluidAdded || trip.accountNumber) ? `
                    <div class="trip-card-footer">
                        ${trip.oilAdded ? '<span class="trip-badge">🛢️ Olej</span>' : ''}
                        ${trip.washerFluidAdded ? '<span class="trip-badge">💧 Płyn</span>' : ''}
                        ${trip.accountNumber ? `<span class="trip-badge account-badge">📋 ${trip.accountNumber}</span>` : ''}
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function renderTripsTable(snapshot) {
    try {
        
        const tbody = document.getElementById('tripsTableBody');
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="19" style="text-align: center; padding: 40px;">
                        <div class="empty-state-icon" style="font-size: 60px;">📋</div>
                        <h3 style="color: #666; margin-top: 15px;">Brak rejestracji podróży</h3>
                        <p style="color: #999;">Podróże pojawią się tutaj, gdy kierowcy będą używać aplikacji</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const trip = doc.data();
            const tripId = doc.id;
            
            const kmTraveled = trip.kmEnd - trip.kmStart;
            const consumption = kmTraveled > 0 ? ((trip.fuelUsed / kmTraveled) * 100).toFixed(2) : '0.00';
            
            const row = document.createElement('tr');
            row.className = 'trip-row';
            row.innerHTML = `
                <td><input type="checkbox" class="trip-checkbox" data-trip-id="${tripId}"></td>
                <td>${trip.date ? new Date(trip.date.toDate()).toLocaleDateString('pl-PL') : '-'}</td>
                <td>${trip.driverName || '-'}</td>
                <td>${trip.hourStart || '-'}</td>
                <td>${trip.hourEnd || '-'}</td>
                <td>${trip.kmStart.toLocaleString()}</td>
                <td>${trip.kmEnd.toLocaleString()}</td>
                <td>${kmTraveled.toLocaleString()}</td>
                <td class="desktop-only">${trip.originCity || '-'}</td>
                <td class="desktop-only">${trip.destinationCity || '-'}</td>
                <td>${trip.fuelStart?.toFixed(1) || '-'}</td>
                <td>${trip.fuelUsed?.toFixed(1) || '-'}</td>
                <td class="desktop-only">${trip.refuelLiters ? trip.refuelLiters + ' L' : '-'}</td>
                <td class="desktop-only">${trip.oilAdded ? '✅' : '-'}</td>
                <td class="desktop-only">${trip.washerFluidAdded ? '✅' : '-'}</td>
                <td class="desktop-only account-col">${trip.accountNumber || '-'}</td>
                <td class="mobile-expand">
                    <button class="btn-expand" onclick="toggleTripDetails('${tripId}')">+</button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // Add expandable details row (hidden by default)
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'trip-details';
            detailsRow.id = 'details-${tripId}';
            detailsRow.style.display = 'none';
            detailsRow.innerHTML = `
                <td colspan="100%">
                    <div class="trip-details-content">
                        <div class="detail-grid">
                            <div><strong>Początek:</strong> ${trip.originCity || '-'}</div>
                            <div><strong>Cel:</strong> ${trip.destinationCity || '-'}</div>
                            <div><strong>Nr Konta:</strong> ${trip.accountNumber || '-'}</div>
                            <div><strong>Tankowanie:</strong> ${trip.refuelLiters ? trip.refuelLiters + ' L' : '-'}</div>
                            <div><strong>Typ Paliwa:</strong> ${trip.fuelType || '-'}</div>
                            <div><strong>Dodany olej:</strong> ${trip.oilAdded ? 'Tak' : 'Nie'}</div>
                            <div><strong>Płyn czyszczący:</strong> ${trip.washerFluidAdded ? 'Tak' : 'Nie'}</div>
                        </div>
                    </div>
                </td>
            `;
            
            tbody.appendChild(detailsRow);
        }
    } catch (error) {
        console.error('Błąd podczas renderowania tabeli:', error);
    }
}

// Toggle between card and table view
viewToggleBtn.addEventListener('click', () => {
    isCardView = !isCardView;
    
    const cardsView = document.getElementById('tripsCardsView');
    const tableView = document.getElementById('tripsTableView');
    const icon = document.getElementById('viewToggleIcon');
    
    if (isCardView) {
        cardsView.style.display = 'block';
        tableView.style.display = 'none';
        viewToggleBtn.innerHTML = '<span id="viewToggleIcon">📊</span> Widok Tabeli';
        loadTripsRealtime();
    } else {
        cardsView.style.display = 'none';
        tableView.style.display = 'block';
        viewToggleBtn.innerHTML = '<span id="viewToggleIcon">🎴</span> Widok Kart';
        loadTripsRealtime();
    }
});

vehicleFilter.addEventListener('change', loadTripsRealtime);

// Backward compatibility
async function loadTrips() {
    // No hace nada - el listener maneja todo
}

// Select All
selectAllCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.trip-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

// Export PDF
exportPdfBtn.addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.trip-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Proszę wybierz przynajmniej jeden rekord do eksportu');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const tableData = [];
    
    for (const checkbox of selectedCheckboxes) {
        const tripId = checkbox.dataset.tripId;
        const tripDoc = await db.collection('trips').doc(tripId).get();
        const trip = tripDoc.data();
        const date = trip.date ? trip.date.toDate() : new Date();
        const kmTraveled = trip.kmEnd - trip.kmStart;
        const consumption = kmTraveled > 0 ? ((trip.fuelUsed / kmTraveled) * 100).toFixed(2) : '0.00';
        
        tableData.push([
            date.toLocaleDateString('pl-PL'),
            trip.driverName || '-',
            trip.hourStart || '-',
            trip.hourEnd || '-',
            trip.kmStart.toLocaleString(),
            trip.kmEnd.toLocaleString(),
            kmTraveled.toLocaleString(),
            trip.originCity || '-',
            trip.destinationCity || '-',
            trip.fuelStart?.toFixed(1) || '-',
            trip.fuelUsed?.toFixed(1) || '-',
            trip.refuelLiters ? trip.refuelLiters + ' L' : '-',
            consumption,
            trip.oilAdded ? 'Sí' : 'No',
            trip.washerFluidAdded ? 'Sí' : 'No',
            trip.accountNumber || '-'
        ]);
    }
    
    doc.setFontSize(18);
    doc.text('Alterga Transport - Rejestr Podróży', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 14, 22);
    
    doc.autoTable({
        head: [[
            'Data', 'Kierowca', 'H. Początek', 'H. Koniec', 'Km Początek', 'Km Koniec',
            'Km Razem', 'Początek', 'Cel', 'Paliwo Początek', 'Zużyte', 'Tankowanie', 'Zużycie', 'Olej', 'Płyn', 'Nr Konta'
        ]],
        body: tableData,
        startY: 28,
        styles: { fontSize: 6.5 },
        headStyles: { fillColor: [102, 126, 234] },
        columnStyles: { 15: { cellWidth: 20 } }
    });
    
    doc.save(`viajes_${new Date().toISOString().split('T')[0]}.pdf`);
});



// Vehicle Detail View
async function showVehicleDetail(vehicleId) {
    currentVehicleDetail = vehicleId;
    
    try {
        const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
        if (!vehicleDoc.exists) return;
        
        const vehicle = vehicleDoc.data();
        
        // Update title
        document.getElementById('vehicleDetailTitle').textContent = 
            `${vehicle.brand} ${vehicle.model} (${vehicle.registration})`;
        
        // Load trips for this vehicle
        await loadVehicleDetailTrips(vehicleId, vehicle);
        
        // Switch to detail view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('vehicleDetailView').classList.add('active');
        
    } catch (error) {
        console.error('Błąd podczas ładowania szczegółów:', error);
    }
}

async function loadVehicleDetailTrips(vehicleId, vehicle) {
    try {
        const snapshot = await db.collection('trips')
            .where('userId', '==', currentUser.uid)
            .where('vehicleId', '==', vehicleId)
            .get();
        
        const container = document.querySelector('#vehicleDetailTrips .table-container');
        
        // Group trips by date for the tables
        const trips = [];
        snapshot.forEach(doc => {
            const trip = doc.data();
            trips.push({
                ...trip,
                id: doc.id,
                date: trip.date ? trip.date.toDate() : new Date()
            });
        });

        // Sort trips by date
        trips.sort((a, b) => a.date - b.date);

        // Generate HTML
        let html = '';

        // Vehicle info header
        html += `
        <div class="vehicle-info-header">
        <h2>KARTA DROGOWA</h2>
        <div class="vehicle-details-grid">
        <div><strong>Nr konta:</strong> ${vehicle.vehicleNumber || '-'}</div>
        <div><strong>Data od:</strong> ${vehicle.dateFrom ? new Date(vehicle.dateFrom).toLocaleDateString('pl-PL') : '-'}</div>
        <div><strong>Data do:</strong> ${vehicle.dateTo ? new Date(vehicle.dateTo).toLocaleDateString('pl-PL') : '-'}</div>
        </div>
        </div>

        <!-- Primera tabla: Refueling records -->
        <div class="refuel-table-section">
        <h3>Raport zużycia paliwa</h3>
        <div style="font-size: 12px; font-weight: normal; margin-top: 5px;">Zużycie na mot Norma: ${vehicle.fuelNorm || '-'} L/100km</div>
        <table class="trips-table refuel-table">
        <thead>
        <tr>
        <th>Dzień<br>m-c</th>
        <th>Pocz. st<br>paliwa</th>
        <th>Sym. Pal,<br>Faktura</th>
        <th>Ilość</th>
        <th>Wartość</th>
        <th>Zużycie</th>
        <th>Końcowy stan<br>paliwa</th>
        <th>Oszczędność</th>
        <th>Przepał</th>
        </tr>
        </thead>
        <tbody>
        `;

        // Agregar datos o filas vacías hasta 15
        for (let i = 0; i < 15; i++) {
            if (i < trips.length) {
                const trip = trips[i];
                const dateStr = trip.date.toLocaleDateString('pl-PL');
                html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${trip.fuelStart?.toFixed(1) || '-'}</td>
                    <td>${trip.accountNumber || '-'}</td>
                    <td>${trip.refuelLiters || '-'}</td>
                    <td>-</td> <!-- Wartość -->
                    <td>${trip.fuelUsed?.toFixed(1) || '-'}</td>
                    <td>${trip.fuelEnd?.toFixed(1) || '-'}</td>
                    <td>-</td> <!-- Oszczędność -->
                        <td>-</td> <!-- Przepał -->
                </tr>
                `;
            } else {
                html += `
                <tr>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                        <td>-</td>
                </tr>
                `;
            }
        }

        html += `
        </tbody>
        </table>
        </div>

        <!-- Segunda tabla: Trip records -->
        <div class="trip-table-section">
        <h3>Rejestr podróży</h3>
        <table class="trips-table trip-records-table">
        <thead>
        <tr>
            <th>Dzień m-c</th>
            <th>Godzina wyjazdu</th>
        <th>Początkowy stan licznika</th>
            <th>Godzina przyjazdu</th>
                <th>Końcowy stan licznika</th>
                <th>Ogółem</th>
            <th>Nazwisko kierującego</th>
        </tr>
        </thead>
        <tbody>
        `;

        // Agregar datos o filas vacías hasta 15
        for (let i = 0; i < 15; i++) {
            if (i < trips.length) {
                const trip = trips[i];
                const dateStr = trip.date.toLocaleDateString('pl-PL');
                const kmTraveled = trip.kmEnd - trip.kmStart;
                html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${trip.hourStart || '-'}</td>
                    <td>${trip.kmStart?.toLocaleString() || '-'}</td>
                    <td>${trip.hourEnd || '-'}</td>
                    <td>${trip.kmEnd?.toLocaleString() || '-'}</td>
                    <td>${kmTraveled?.toLocaleString() || '-'}</td>
                    <td>${trip.driverName || '-'}</td>
                </tr>
                `;
            } else {
                html += `
                <tr>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                </tr>
                `;
            }
        }

        html += `
                </tbody>
            </table>
        </div>
        `;

        container.innerHTML = html;
        
    } catch (error) {
        console.error('Błąd podczas ładowania podróży:', error);
    }
}

if (backToVehiclesBtn) {
    backToVehiclesBtn.addEventListener('click', () => {
        currentVehicleDetail = null;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('vehiclesView').classList.add('active');
    });
}

exportVehiclePdfBtn.addEventListener('click', async () => {
    if (!currentVehicleDetail) return;

    try {
        const vehicleDoc = await db.collection('vehicles').doc(currentVehicleDetail).get();
        const vehicle = vehicleDoc.data();

        const snapshot = await db.collection('trips')
            .where('userId', '==', currentUser.uid)
            .where('vehicleId', '==', currentVehicleDetail)
            .get();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        // Usar Times New Roman, que soporta caracteres polacos básicos
        doc.setFont('Times');
        doc.setFontSize(18);
        doc.text('KARTA DROGOWA', 14, 15);

        doc.setFontSize(12);
        doc.text(`${vehicle.brand} ${vehicle.model} (${vehicle.registration})`, 14, 25);

        doc.setFontSize(10);
        doc.text(`Nr konta: ${vehicle.vehicleNumber || '-'}`, 14, 32);
        doc.text(`Data od: ${vehicle.dateFrom ? new Date(vehicle.dateFrom).toLocaleDateString('pl-PL') : '-'}`, 80, 32);
        doc.text(`Data do: ${vehicle.dateTo ? new Date(vehicle.dateTo).toLocaleDateString('pl-PL') : '-'}`, 140, 32);

        doc.setFontSize(8);
        doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 14, 38);

        let yPosition = 45;

        // Primera tabla: Raport zużycia paliwa
        doc.setFontSize(14);
        doc.text('Raport zużycia paliwa', 14, yPosition);
        yPosition += 6;
        doc.setFontSize(10);
        doc.text(`Zużycie na mot Norma: ${vehicle.fuelNorm || '-'} L/100km`, 14, yPosition);
        yPosition += 10;

        const refuelData = [];
        snapshot.forEach(tripDoc => {
        const trip = tripDoc.data();
        const date = trip.date ? trip.date.toDate() : new Date();
        refuelData.push([
        date.toLocaleDateString('pl-PL'),
        trip.fuelStart?.toFixed(1) || '-',
        trip.accountNumber || '-',
        trip.refuelLiters || '-',
        '-', // Wartość (no data yet)
        trip.fuelUsed?.toFixed(1) || '-',
        trip.fuelEnd?.toFixed(1) || '-',
            '-' // Oszczędność (no data yet)
            ]);
        });

        // Agregar filas vacías hasta 15
        while (refuelData.length < 15) {
            refuelData.push(['-', '-', '-', '-', '-', '-', '-', '-']);
        }

        doc.autoTable({
        head: [["Dzień\nm-c", "Pocz. st\npaliwa", "Sym. Pal,\nFaktura", "Ilość", "Wartość", "Zużycie", "Końcowy stan\npaliwa", "Oszczędność"]],
        body: refuelData,
        startY: yPosition,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [102, 126, 234] },
        theme: 'grid' // Ensure lines
        });

        yPosition = doc.lastAutoTable.finalY + 20;

        // Segunda tabla: Rejestr podróży
        doc.setFontSize(14);
        doc.text('Rejestr podróży', 14, yPosition);
        yPosition += 10;

        const tripData = [];
        snapshot.forEach(tripDoc => {
            const trip = tripDoc.data();
            const date = trip.date ? trip.date.toDate() : new Date();
            const kmTraveled = trip.kmEnd - trip.kmStart;
            tripData.push([
                date.toLocaleDateString('pl-PL'),
                trip.hourStart || '-',
                trip.kmStart.toLocaleString(),
                trip.hourEnd || '-',
                trip.kmEnd.toLocaleString(),
                kmTraveled.toLocaleString(),
                trip.driverName || '-'
            ]);
        });

        // Agregar filas vacías hasta 15
        while (tripData.length < 15) {
            tripData.push(['-', '-', '-', '-', '-', '-', '-']);
        }

        doc.autoTable({
        head: [['Dzień m-c', 'Godzina wyjazdu', 'Początkowy stan licznika', 'Godzina przyjazdu', 'Końcowy stan licznika', 'Ogółem', 'Nazwisko kierującego']],
        body: tripData,
        startY: yPosition,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [102, 126, 234] },
            theme: 'grid'
        });

        const fileName = `${vehicle.brand}_${vehicle.model}_${vehicle.registration}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName.replace(/\s/g, '_'));
        
    } catch (error) {
        console.error('Błąd podczas eksportowania PDF:', error);
        alert('Błąd podczas eksportowania PDF');
    }
});

// Return keys function
async function returnKeys(vehicleId) {
    if (!confirm('Potwierdzić zwrot kluczy?')) {
        return;
    }
    
    try {
        await db.collection('vehicles').doc(vehicleId).update({
            keysDelivered: false,
            keysDeliveredTo: null,
            status: 'available',
            currentDriver: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // No llamamos loadVehicles() - el listener actualiza automáticamente
    } catch (error) {
        console.error('Błąd podczas zwrotu kluczy:', error);
        alert('Błąd podczas rejestracji zwrotu kluczy');
    }
}

// Toggle trip details for mobile
function toggleTripDetails(tripId) {
    const detailsRow = document.getElementById('details-' + tripId);
    const btn = event.target;
    
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
        btn.textContent = '−';
        btn.style.transform = 'rotate(0deg)';
    } else {
        detailsRow.style.display = 'none';
        btn.textContent = '+';
        btn.style.transform = 'rotate(0deg)';
    }
}

// Assignments Management
const newAssignmentBtn = document.getElementById('newAssignmentBtn');
const assignmentModal = document.getElementById('assignmentModal');
const assignmentForm = document.getElementById('assignmentForm');
const cancelAssignmentBtn = document.getElementById('cancelAssignmentBtn');
const assignmentModalClose = document.getElementById('assignmentModalClose');

// Assignment modal controls
newAssignmentBtn.addEventListener('click', () => {
    openAssignmentModal();
});

assignmentModalClose.addEventListener('click', closeAssignmentModal);
cancelAssignmentBtn.addEventListener('click', closeAssignmentModal);

window.addEventListener('click', (e) => {
    if (e.target === assignmentModal) {
        closeAssignmentModal();
    }
});

// Assignment form submission
assignmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveAssignment();
});

function openAssignmentModal() {
    loadVehiclesForAssignment();
    loadDriversForAssignment();
    assignmentModal.classList.add('active');
}

function closeAssignmentModal() {
    assignmentModal.classList.remove('active');
    assignmentForm.reset();
}

async function loadVehiclesForAssignment() {
    const vehicleSelect = document.getElementById('assignmentVehicle');
    vehicleSelect.innerHTML = '<option value="">Wybierz pojazd</option>';

    try {
        const querySnapshot = await db.collection('vehicles').where('userId', '==', currentUser.uid).get();
        querySnapshot.forEach((doc) => {
            const vehicle = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${vehicle.brand} ${vehicle.model} - ${vehicle.registration}`;
            vehicleSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading vehicles for assignment:', error);
    }
}

async function loadDriversForAssignment() {
    const driverSelect = document.getElementById('assignmentDriver');
    driverSelect.innerHTML = '<option value="">Wybierz kierowcę</option>';

    try {
        // For now, we'll use a simple approach - in a real app, you'd have a users collection
        // For demo, we'll add some sample drivers
        const sampleDrivers = [
            { id: 'driver1', name: 'Jan Kowalski' },
            { id: 'driver2', name: 'Marek Nowak' },
            { id: 'driver3', name: 'Piotr Wiśniewski' },
        ];

        sampleDrivers.forEach(driver => {
            const option = document.createElement('option');
            option.value = driver.id;
            option.textContent = driver.name;
            driverSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading drivers for assignment:', error);
    }
}

async function saveAssignment() {
    const vehicleId = document.getElementById('assignmentVehicle').value;
    const driverId = document.getElementById('assignmentDriver').value;
    const pin = document.getElementById('assignmentPin').value;
    const notes = document.getElementById('assignmentNotes').value;

    if (!vehicleId || !driverId) {
        alert('Proszę wybrać pojazd i kierowcę');
        return;
    }

    try {
        await db.collection('authorizations').add({
            vehicleId: vehicleId,
            driverId: driverId,
            pin: pin || null,
            notes: notes || null,
            status: 'active',
            grantedAt: firebase.firestore.FieldValue.serverTimestamp(),
            grantedBy: currentUser.uid,
            userId: currentUser.uid,
        });

        console.log('✅ Przypisanie utworzone pomyślnie');
        closeAssignmentModal();
        // loadAssignments() will be called automatically by listener
    } catch (error) {
        console.error('❌ Błąd tworzenia przypisania:', error);
        alert('Błąd tworzenia przypisania: ' + error.message);
    }
}

async function loadAssignments() {
    const tableBody = document.getElementById('assignmentsTableBody');
    tableBody.innerHTML = '';

    try {
        const querySnapshot = await db.collection('authorizations')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .orderBy('grantedAt', 'desc')
            .get();

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Brak aktywnych przypisań</td></tr>';
            return;
        }

        // Use a Set to avoid duplicates
        const addedIds = new Set();

        for (const doc of querySnapshot.docs) {
            if (addedIds.has(doc.id)) continue; // Skip if already added
            addedIds.add(doc.id);

            const assignment = doc.data();
            const vehicleDoc = await db.collection('vehicles').doc(assignment.vehicleId).get();
            const vehicle = vehicleDoc.data();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.registration}` : 'Nieznany pojazd'}</td>
                <td>${assignment.driverId}</td>
                <td>${assignment.grantedAt ? new Date(assignment.grantedAt.toDate()).toLocaleString('pl-PL') : 'Brak daty'}</td>
                <td><span class="status-badge status-${assignment.status}">${assignment.status}</span></td>
                <td>
                    <button onclick="revokeAssignment('${doc.id}')" class="btn-secondary">Cofnij</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Błąd ładowania przypisań</td></tr>';
    }
}

async function revokeAssignment(assignmentId) {
    if (!confirm('Czy na pewno chcesz cofnąć to przypisanie?')) {
        return;
    }

    try {
        await db.collection('authorizations').doc(assignmentId).update({
            status: 'revoked',
            revokedAt: firebase.firestore.FieldValue.serverTimestamp(),
            revokedBy: currentUser.uid,
        });

        console.log('✅ Przypisanie cofnięte');
        // loadAssignments() will be called automatically by listener
    } catch (error) {
        console.error('❌ Błąd cofania przypisania:', error);
        alert('Błąd cofania przypisania: ' + error.message);
    }
}

async function loadTransfers() {
    const tableBody = document.getElementById('transfersTableBody');
    tableBody.innerHTML = '';

    try {
        const querySnapshot = await db.collection('transfers')
            .where('fromUserId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Brak transferencji</td></tr>';
            return;
        }

        for (const doc of querySnapshot.docs) {
            const transfer = doc.data();
            const vehicleDoc = await db.collection('vehicles').doc(transfer.vehicleId).get();
            const vehicle = vehicleDoc.data();

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.registration}` : 'Nieznany pojazd'}</td>
                <td>${transfer.fromUserId}</td>
                <td>${transfer.toUserId}</td>
                <td>${transfer.createdAt ? new Date(transfer.createdAt.toDate()).toLocaleString('pl-PL') : 'Brak daty'}</td>
                <td><span class="status-badge status-${transfer.status || 'pending'}">${transfer.status || 'pending'}</span></td>
                <td>
                    <button onclick="deleteTransfer('${doc.id}')" class="btn-secondary">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading transfers:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Błąd ładowania transferencji</td></tr>';
    }
}

async function deleteTransfer(transferId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transferencia?')) {
        return;
    }

    try {
        await db.collection('transfers').doc(transferId).delete();
        console.log('✅ Transferencia eliminada');
        // loadTransfers() will be called automatically by listener
    } catch (error) {
        console.error('❌ Error eliminando transferencia:', error);
        alert('Error eliminando transferencia: ' + error.message);
    }
}

// Make functions global for onclick handlers
// Issues functionality
function setupIssuesListener() {
    if (issuesListener) {
        issuesListener();
    }
    issuesListener = db.collection('issues')
        .where('status', '==', 'active')
        .orderBy('fecha', 'desc')
        .onSnapshot((snapshot) => {
            loadIssues(snapshot);
        });
}

async function loadIssues(snapshot = null) {
    const tableBody = document.getElementById('issuesTableBody');
    tableBody.innerHTML = '';

    let querySnapshot;
    if (snapshot) {
        querySnapshot = snapshot;
    } else {
        try {
            querySnapshot = await db.collection('issues')
                .where('status', '==', 'active')
                .orderBy('fecha', 'desc')
                .get();
        } catch (error) {
            console.error('Error loading issues:', error);
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Błąd ładowania problemów</td></tr>';
            return;
        }
    }

    if (querySnapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Brak aktywnych problemów</td></tr>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const issue = doc.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${issue.conductorId || 'Desconocido'}</td>
            <td>${issue.tipoAveria || 'N/A'}</td>
            <td>${issue.descripcion || 'Sin descripción'}</td>
            <td>${issue.fecha ? new Date(issue.fecha.toDate()).toLocaleString('es-ES') : 'Sin fecha'}</td>
            <td><span class="status-badge status-${issue.status || 'active'}">${issue.status || 'active'}</span></td>
            <td>
            <button onclick="resolveIssue('${doc.id}')" class="btn-primary">Rozwiąż</button>
            <button onclick="deleteIssue('${doc.id}')" class="btn-secondary">Usuń</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function resolveIssue(issueId) {
    if (!confirm('Czy oznaczyć tę awarię jako rozwiązaną?')) {
        return;
    }

    try {
        // Opción: mover a resolved_issues
        const issueDoc = await db.collection('issues').doc(issueId).get();
        const issueData = issueDoc.data();
        await db.collection('resolved_issues').add({
            ...issueData,
            resolvedAt: new Date()
        });

        // Luego eliminar de issues
        await db.collection('issues').doc(issueId).delete();

        console.log('✅ Problem rozwiązany i zarchiwizowany');
    } catch (error) {
        console.error('❌ Error resolviendo issue:', error);
        alert('Błąd podczas rozwiązywania problemu: ' + error.message);
    }
}

async function deleteIssue(issueId) {
    if (!confirm('Czy na pewno usunąć tę awarię na stałe?')) {
        return;
    }

    try {
        await db.collection('issues').doc(issueId).delete();
        console.log('✅ Problem usunięty');
    } catch (error) {
        console.error('❌ Error eliminando issue:', error);
        alert('Błąd podczas usuwania problemu: ' + error.message);
    }
}

// Refresh button
document.getElementById('refreshIssuesBtn').addEventListener('click', () => {
    loadIssues();
});

// Make functions global
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.showVehicleDetail = showVehicleDetail;
window.returnKeys = returnKeys;
window.toggleTripDetails = toggleTripDetails;
window.revokeAssignment = revokeAssignment;
window.deleteTransfer = deleteTransfer;
window.resolveIssue = resolveIssue;
window.deleteIssue = deleteIssue;

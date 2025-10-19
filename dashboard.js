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
const generateTestDataBtn = document.getElementById('generateTestDataBtn');
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

// Authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userEmailSpan.textContent = user.email;
        setupVehiclesListener();
        setupTripsListener();
    } else {
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
        
        const vehicleData = {
            registration: document.getElementById('registration').value,
            model: document.getElementById('model').value,
            brand: document.getElementById('brand').value,
            year: parseInt(document.getElementById('year').value) || null,
            currentKm: parseFloat(document.getElementById('currentKm').value),
            currentFuel: parseFloat(document.getElementById('currentFuel').value),
            fuelCapacity: parseFloat(document.getElementById('fuelCapacity').value) || null,
            tireType: document.getElementById('tireType').value,
            lastServiceKm: parseFloat(document.getElementById('lastServiceKm').value) || 0,
            fuelNorm: parseFloat(document.getElementById('fuelNorm').value) || null,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            status: document.getElementById('status').value,
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
        
        closeModal();
        // No llamamos loadVehicles() - el listener actualiza automáticamente
    } catch (error) {
        console.error('Błąd podczas zapisywania pojazdu:', error);
        alert('Błąd podczas zapisywania pojazdu: ' + error.message);
    }
});

// Real-time listener for vehicles
function setupVehiclesListener() {
    db.collection('vehicles')
        .where('userId', '==', currentUser.uid)
        .onSnapshot((snapshot) => {
            renderVehicles(snapshot);
        }, (error) => {
            console.error('Błąd w słuchaczu pojazdów:', error);
        });
}

function renderVehicles(snapshot) {
    try {
        
        const vehiclesGrid = document.getElementById('vehiclesGrid');
        const vehicleFilterSelect = document.getElementById('vehicleFilter');
        
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
        
        vehiclesGrid.innerHTML = '';
        vehicleFilterSelect.innerHTML = '<option value="">Wszystkie pojazdy</option>';
        
        snapshot.forEach(doc => {
            const vehicle = doc.data();
            const vehicleId = doc.id;
            
            // Add to filter
            const option = document.createElement('option');
            option.value = vehicleId;
            option.textContent = `${vehicle.brand} ${vehicle.model} - ${vehicle.registration}`;
            vehicleFilterSelect.appendChild(option);
            
            // Calcular si necesita servicio (cada 10,000 km)
            const lastService = vehicle.lastServiceKm || 0;
            const kmSinceService = vehicle.currentKm - lastService;
            const needsService = kmSinceService >= 10000;
            const kmUntilService = needsService ? 0 : 10000 - kmSinceService;
            
            // Obtener estado del vehículo
            const status = vehicle.status || 'available';
            let statusIcon = '';
            let statusText = '';
            let statusClass = status;
            
            if (status === 'broken') {
                statusIcon = '🔴';
                statusText = 'USZKODZONY';
            } else if (status === 'occupied') {
                statusIcon = '🔵';
                statusText = vehicle.currentDriver || 'Zajęty';
            } else {
                statusIcon = '✅';
                statusText = 'Dostępny';
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
            card.innerHTML = `
                <div class="vehicle-status-badge ${statusClass}">
                    ${statusIcon} ${statusText}
                </div>
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
                            <div class="stat-label"><img src="gasoline-level.png" class="fuel-icon"> Paliwo</div>
                            <div class="stat-value">${vehicle.currentFuel} L</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">${tireIcon} Opony</div>
                            <div class="stat-value">${tireText}</div>
                        </div>
                        <div class="stat ${needsService ? 'stat-warning' : ''}">
                            <div class="stat-label">${needsService ? '⚠️' : '🔧'} Następny Serwis</div>
                            <div class="stat-value">${needsService ? 'Teraz' : `${kmUntilService.toLocaleString()} km`}</div>
                        </div>
                    </div>
                    
                    <div class="vehicle-actions">
                        <button class="btn-edit" onclick="event.stopPropagation(); editVehicle('${vehicleId}')">Edytuj</button>
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
    } catch (error) {
        console.error('Błąd podczas renderowania pojazdów:', error);
    }
}

// Backward compatibility - called when editing
async function loadVehicles() {
    // No hace nada - el listener maneja todo
}

function editVehicle(vehicleId) {
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
                    <td colspan="20" style="text-align: center; padding: 40px;">
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
                <td>${consumption}</td>
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
    const doc = new jsPDF('l', 'mm', 'a4');
    
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

// Generate test data
generateTestDataBtn.addEventListener('click', async () => {
    if (!confirm('Czy wygenerować dane testowe? To utworzy 5 przykładowych podróży dla wybranego pojazdu.')) {
        return;
    }
    
    try {
        // Get all vehicles
        const vehiclesSnapshot = await db.collection('vehicles')
            .where('userId', '==', currentUser.uid)
            .limit(1)
            .get();
        
        if (vehiclesSnapshot.empty) {
            alert('Najpierw musisz utworzyć przynajmniej jeden pojazd.');
            return;
        }
        
        const vehicleDoc = vehiclesSnapshot.docs[0];
        const vehicleId = vehicleDoc.id;
        const vehicle = vehicleDoc.data();
        
        const drivers = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Pedro Sánchez'];
        const currentKm = vehicle.currentKm;
        const currentFuel = vehicle.currentFuel;
        
        let kmCounter = currentKm - 1000; // Empezar 1000 km atrás
        let fuelCounter = currentFuel;
        
        // Crear 5 viajes de prueba
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (4 - i)); // 5 días atrás hasta hoy
            
            const kmTraveled = Math.floor(Math.random() * 150) + 50; // 50-200 km
            const hourStart = `0${8 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 6)}0`;
            const hoursWorked = Math.floor(Math.random() * 4) + 2; // 2-6 horas
            const minutesWorked = Math.floor(Math.random() * 60);
            const endHour = parseInt(hourStart.split(':')[0]) + hoursWorked;
            const endMinute = (parseInt(hourStart.split(':')[1]) + minutesWorked) % 60;
            const hourEnd = `${endHour}:${endMinute.toString().padStart(2, '0')}`;
            
            const fuelUsed = (kmTraveled / 100) * (6 + Math.random() * 4); // 6-10 L/100km
            
            // Datos adicionales de prueba
            const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'];
            const accounts = ['PL-2024-001', 'PL-2024-002', 'OB-2024-003', 'MN-2024-004'];
            const refueled = Math.random() > 0.7; // 30% chance de repostaje
            
            const kmStart = kmCounter;
            const kmEnd = kmCounter + kmTraveled;
            kmCounter = kmEnd;
            
            const tripData = {
                date: firebase.firestore.Timestamp.fromDate(date),
                driverName: drivers[i % drivers.length],
                fuelStart: parseFloat(fuelCounter.toFixed(1)),
                fuelUsed: parseFloat(fuelUsed.toFixed(1)),
                hourStart: hourStart,
                hourEnd: hourEnd,
                kmStart: kmStart,
                kmEnd: kmEnd,
                originCity: cities[Math.floor(Math.random() * cities.length)],
                destinationCity: cities[Math.floor(Math.random() * cities.length)],
                accountNumber: accounts[Math.floor(Math.random() * accounts.length)],
                refuelLiters: refueled ? Math.floor(Math.random() * 40) + 20 : 0,
                fuelType: 'diesel',
                oilAdded: Math.random() > 0.8,
                washerFluidAdded: Math.random() > 0.7,
                userId: currentUser.uid,
                vehicleId: vehicleId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Si hubo repostaje, sumar al combustible
            if (refueled) {
                fuelCounter += tripData.refuelLiters;
            }
            
            await db.collection('trips').add(tripData);
            fuelCounter -= fuelUsed;
        }
        
        // Actualizar el vehículo con los últimos km
        await db.collection('vehicles').doc(vehicleId).update({
            currentKm: kmCounter,
            currentFuel: parseFloat(fuelCounter.toFixed(1))
        });
        
        alert('✅ Dane testowe wygenerowane poprawnie');
        // No llamamos load - los listeners actualizan automáticamente
        
    } catch (error) {
        console.error('Błąd podczas generowania danych:', error);
        alert('Błąd podczas generowania danych testowych: ' + error.message);
    }
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
                <div><strong>Nr:</strong> ${vehicle.vehicleNumber || '-'}</div>
                <div><strong>Data od:</strong> ${vehicle.dateFrom ? new Date(vehicle.dateFrom).toLocaleDateString('pl-PL') : '-'}</div>
                <div><strong>Data do:</strong> ${vehicle.dateTo ? new Date(vehicle.dateTo).toLocaleDateString('pl-PL') : '-'}</div>
            </div>
        </div>

        <!-- Primera tabla: Refueling records -->
        <div class="refuel-table-section">
            <h3>Rejestr tankowań</h3>
        <table class="trips-table refuel-table">
        <thead>
            <tr>
                <th>Dzień m-c</th>
            <th>Początkowy stan paliwa</th>
        <th>Sym,Pal,Faktura</th>
        <th>Ilość</th>
        <th>Wartość</th>
        <th>Zużycie</th>
        <th>Końcowy stan paliwa</th>
        <th>Oszczędność</th>
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

backToVehiclesBtn.addEventListener('click', () => {
    currentVehicleDetail = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('vehiclesView').classList.add('active');
});

exportVehiclePdfBtn.addEventListener('click', async () => {
    if (!currentVehicleDetail) return;
    
    try {
        const vehicleDoc = await db.collection('vehicles').doc(currentVehicleDetail).get();
        const vehicle = vehicleDoc.data();
        
        const snapshot = await db.collection('trips')
            .where('userId', '==', currentUser.uid)
            .where('vehicleId', '==', currentVehicleDetail)
            .get();
        
        if (snapshot.empty) {
            alert('Brak podróży do eksportu');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(18);
        doc.text('KARTA DROGOWA', 14, 15);

        doc.setFontSize(12);
        doc.text(`${vehicle.brand} ${vehicle.model} (${vehicle.registration})`, 14, 25);

        doc.setFontSize(10);
        doc.text(`Nr: ${vehicle.vehicleNumber || '-'}`, 14, 32);
        doc.text(`Data od: ${vehicle.dateFrom ? new Date(vehicle.dateFrom).toLocaleDateString('pl-PL') : '-'}`, 80, 32);
        doc.text(`Data do: ${vehicle.dateTo ? new Date(vehicle.dateTo).toLocaleDateString('pl-PL') : '-'}`, 140, 32);

        doc.setFontSize(8);
        doc.text(`Wygenerowano: ${new Date().toLocaleDateString('pl-PL')}`, 14, 38);

        let yPosition = 45;

        // Primera tabla: Rejestr tankowań
        doc.setFontSize(14);
        doc.text('Rejestr tankowań', 14, yPosition);
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
        head: [['Dzień m-c', 'Początkowy stan paliwa', 'Sym,Pal,Faktura', 'Ilość', 'Wartość', 'Zużycie', 'Końcowy stan paliwa', 'Oszczędność']],
        body: refuelData,
        startY: yPosition,
        styles: { fontSize: 6 },
        headStyles: { fillColor: [102, 126, 234] }
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
            headStyles: { fillColor: [102, 126, 234] }
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

// Make functions global for onclick handlers
window.editVehicle = editVehicle;
window.deleteVehicle = deleteVehicle;
window.showVehicleDetail = showVehicleDetail;
window.returnKeys = returnKeys;
window.toggleTripDetails = toggleTripDetails;

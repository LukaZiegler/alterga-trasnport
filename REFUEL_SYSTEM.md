# Sistema de Repostaje - App Móvil

## Cuando el conductor reposta combustible

### 1. Mostrar información del vehículo actual

```javascript
const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
const vehicle = vehicleDoc.data();

// Mostrar al conductor:
console.log(`Vehículo: ${vehicle.brand} ${vehicle.model}`);
console.log(`Matrícula: ${vehicle.registration}`);
console.log(`Combustible actual: ${vehicle.currentFuel} L`);
```

### 2. Formulario de repostaje en la app

Pedir al conductor:
- Tipo de combustible: Diesel / Gasolina / Gas
- Litros repostados: (número)
- Kilometraje actual al momento de repostar

### 3. Registrar repostaje en Firestore

```javascript
const refuelData = {
    vehicleId: vehicleId,
    userId: currentUser.uid,
    driverName: "Juan Pérez",
    fuelType: "diesel", // "diesel", "gasoline", "gas"
    liters: 60,
    kmAtRefuel: 12500,
    fuelBefore: vehicle.currentFuel, // Antes de repostar
    fuelAfter: vehicle.currentFuel + 60, // Después de repostar
    date: firebase.firestore.FieldValue.serverTimestamp(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
};

// Guardar repostaje
await db.collection('refuels').add(refuelData);

// Actualizar combustible del vehículo
await db.collection('vehicles').doc(vehicleId).update({
    currentFuel: vehicle.currentFuel + 60,
    lastRefuelDate: firebase.firestore.FieldValue.serverTimestamp()
});
```

### 4. Dashboard mostrará automáticamente

El dashboard con listeners en tiempo real mostrará:
- Combustible actualizado en la tarjeta del vehículo
- Repostaje en la tabla de viajes (columna "Repostaje")
- Cálculo automático de consumo actualizado

## Estructura de datos en Firestore

### Collection: refuels
```javascript
{
    vehicleId: "abc123",
    userId: "user123",
    driverName: "Juan Pérez",
    fuelType: "diesel",
    liters: 60,
    kmAtRefuel: 12500,
    fuelBefore: 10,
    fuelAfter: 70,
    date: timestamp,
    createdAt: timestamp
}
```

### Actualización en trips
Cuando se crea un viaje después de repostar, el sistema calcula el consumo considerando los repostajes intermedios.

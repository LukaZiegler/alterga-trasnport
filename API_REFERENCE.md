# API Reference - Alterga Transport

## Para App Móvil: Actualizar Estado del Vehículo

Cuando el conductor escanea el QR, la app móvil debe actualizar Firestore:

### Escanear QR - Entrega de llaves (Conductor recibe llaves)

```javascript
// ID del vehículo desde el QR
const vehicleId = "yUeVFDobvhkSDoYTKgYS"; 

// Datos del conductor (desde login de la app)
const driverName = "Juan Pérez";

// Actualizar en Firestore - Llaves entregadas + Vehículo ocupado
await db.collection('vehicles').doc(vehicleId).update({
    status: 'occupied',
    currentDriver: driverName,
    keysDelivered: true,
    keysDeliveredTo: driverName,
    assignedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

**Resultado en dashboard:**
- Badge 🔵 "Ocupado - Juan Pérez"
- Badge 🔑 "Llaves entregadas a Juan Pérez"
- Botón "Llaves Devueltas" disponible para el gerente

### Terminar viaje (conductor termina, pero aún tiene llaves)

```javascript
await db.collection('vehicles').doc(vehicleId).update({
    status: 'available',
    currentDriver: null,
    assignedAt: null
    // NOTA: keysDelivered sigue en true hasta que el gerente confirme devolución
});
```

### Devolución de llaves (se hace desde el dashboard por el gerente)

El gerente presiona el botón "Llaves Devueltas" en la tarjeta del vehículo.

Esto ejecuta automáticamente:
```javascript
await db.collection('vehicles').doc(vehicleId).update({
    keysDelivered: false,
    keysDeliveredTo: null,
    status: 'available',
    currentDriver: null
});
```

### Marcar vehículo como averiado

```javascript
await db.collection('vehicles').doc(vehicleId).update({
    status: 'broken',
    currentDriver: null
});
```

### Marcar avería menor (no inmoviliza el vehículo)

```javascript
await db.collection('vehicles').doc(vehicleId).update({
    status: 'minor_issue'
    // El vehículo mantiene su color base (verde/azul) pero muestra icono de reparación
});
```

### Estructura de datos del vehículo en Firestore

```javascript
{
    brand: "Renault",
    model: "Master",
    registration: "NOL12345",
    status: "available" | "occupied" | "broken" | "minor_issue",
    currentDriver: "Juan Pérez" | null,
    keysDelivered: true | false,
    keysDeliveredTo: "Juan Pérez" | null,
    currentKm: 100000,
    currentFuel: 55,
    assignedAt: timestamp | null,
    // ... otros campos
}
```

## Dashboard actualiza automáticamente

El dashboard escucha cambios en tiempo real, así que cuando la app móvil actualiza el estado:
- Badge cambia automáticamente
- Si está "averiado" → Badge rojo parpadeante
- Si está "ocupado" → Muestra nombre del conductor
- Si está "disponible" → Badge verde
- Si está "minor_issue" → Badge verde/azul (según conductor) con icono 🔧 de reparación

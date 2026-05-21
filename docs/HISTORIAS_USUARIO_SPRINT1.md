# Historias de Usuario - Sprint 1

Este documento resume las historias del PDF `Sprint1_SportLeagueManager.pdf` en un formato más fácil de revisar y demostrar.

## Objetivo del Sprint

Construir una base funcional de SportLeague Manager con estructura ordenada, autenticación con Firebase, módulos principales de equipos, jugadores y torneos, validaciones reutilizables, navegación privada y evidencia de pruebas.

## Estado General

| ID | Historia | Estado |
|---|---|---|
| HU-01 | Estructura base del proyecto | Hecha |
| HU-02 | Validadores reutilizables | Hecha |
| HU-03 | Utilidades UI reutilizables | Hecha |
| HU-04 | Servicios genéricos Firestore | Hecha |
| HU-05 | Registro y listado de jugadores | Hecha |
| HU-06 | Registro y listado de torneos | Hecha |
| HU-07 | Cerrar sesión | Hecha |
| HU-08 | Proteger páginas privadas | Hecha |
| HU-09 | Mantener sesión activa | Hecha |
| HU-10 | Cuenta administradora inicial | Hecha |
| HU-11 | Validaciones en login y registro | Hecha |
| HU-12 | Navbar global en páginas privadas | Hecha |
| HU-13 | Mensajes de éxito/error | Hecha |
| HU-14 | Loaders en acciones | Hecha |
| HU-15 | Estados vacíos | Hecha |
| HU-16 | Diseño responsive | Hecha |
| HU-17 | Listar equipos | Hecha |
| HU-18 | Registrar equipo | Hecha |
| HU-19 | Ver detalle de equipo | Hecha |
| HU-20 | Editar equipo | Hecha |
| HU-21 | Desactivar/activar equipo | Hecha |
| HU-22 | Eliminar equipo permanente | Hecha |
| HU-23 | Buscar y filtrar equipos | Hecha |

## Historias Implementadas

### HU-01 - Estructura base

Se organizó el proyecto con:

```text
public/
├─ index.html
├─ login.html
├─ register.html
├─ dashboard.html
├─ teams.html
├─ players.html
├─ tournaments.html
└─ assets/
   ├─ css/styles.css
   └─ js/
      ├─ firebase.js
      ├─ auth.js
      ├─ firestore.js
      ├─ validators.js
      ├─ ui.js
      ├─ teams.js
      ├─ players.js
      ├─ tournaments.js
      ├─ login.js
      └─ register.js
```

### HU-02 - Validadores

`validators.js` centraliza validaciones para campos obligatorios, correo, longitud mínima, números positivos, fechas y número de camiseta.

### HU-03 - Utilidades UI

`ui.js` centraliza alertas, loaders, estados vacíos, confirmaciones y renderizado básico de filas.

### HU-04 - Firestore

`firestore.js` centraliza operaciones genéricas:

- `createDocument`
- `getDocuments`
- `getDocumentById`
- `updateDocument`
- `deleteDocument`
- `toggleActive`
- `checkDuplicate`

### HU-05 - Jugadores

`players.html` permite registrar jugadores con equipo, nombre completo, matrícula, posición y número de camiseta. También valida que el número no se repita dentro del mismo equipo.

### HU-06 - Torneos

`tournaments.html` permite crear y editar torneos con nombre, deporte, fechas y descripción. Valida fechas y nombres duplicados.

### HU-07, HU-08 y HU-09 - Sesión

`auth.js` implementa:

- login con Firebase Authentication;
- registro con Firebase Authentication;
- cierre de sesión;
- protección de páginas privadas;
- restauración automática de sesión;
- visualización de usuario autenticado en navbar.

### HU-10 - Usuario administrador

La cuenta administradora se puede crear desde `register.html`. Al registrarse, también se crea documento en `users` con `role: "admin"` y `active: true`.

### HU-11 - Validaciones de auth

`login.html` y `register.html` usan validadores y muestran mensajes claros con Bootstrap.

### HU-12 - Navbar global

Las páginas privadas incluyen navbar con enlaces a Dashboard, Equipos, Jugadores, Torneos y Partidos, además de usuario autenticado y botón de logout.

### HU-13, HU-14 y HU-15 - UX

Se usan alertas, loaders en botones y estados vacíos cuando no hay registros.

### HU-16 - Responsive

El diseño usa Bootstrap Grid, tablas responsive y estilos adaptados a móvil, tablet y escritorio.

### HU-17 a HU-23 - Equipos

`teams.html` y `teams.js` implementan:

- listado de equipos;
- alta de equipo;
- detalle con jugadores asociados;
- edición;
- activación/desactivación lógica;
- eliminación permanente;
- búsqueda por nombre;
- filtros por categoría y estado.

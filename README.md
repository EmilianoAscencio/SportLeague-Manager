# SportLeague Manager

Aplicación web desarrollada con **HTML, CSS, JavaScript y Firebase** para la administración de ligas y torneos deportivos universitarios.

El sistema permite gestionar equipos, jugadores, torneos y partidos, además de controlar el acceso mediante autenticación de usuarios y roles administrativos.

## Requisitos previos

| Herramienta           | Versión mínima              |
| --------------------- | --------------------------- |
| Navegador web moderno | Chrome, Edge o Firefox      |
| Firebase              | Plan Spark (gratuito)       |
| Live Server           | Recomendado para desarrollo |

---

## Estructura del proyecto

```text
SportLeague-Manager/
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── teams.html
│   ├── players.html
│   ├── tournaments.html
│   ├── matches.html
│   └── assets/
│       ├── css/
│       │   └── styles.css
│       └── js/
│           ├── firebase.js
│           ├── auth.js
│           ├── firestore.js
│           ├── validators.js
│           ├── ui.js
│           ├── teams.js
│           ├── players.js
│           ├── tournaments.js
│           └── matches.js
├── firestore.rules
└── README.md
```

---

## Ejecución local

Al ser una aplicación desarrollada con HTML, CSS y JavaScript puro, no requiere proceso de compilación.

Abrir el proyecto utilizando Live Server en Visual Studio Code.
---

## Módulos principales

### Autenticación

* Registro de usuarios.
* Inicio y cierre de sesión.
* Protección de páginas privadas.
* Control de acceso mediante roles.

### Equipos

* Registro de equipos.
* Edición de información.
* Consulta detallada.
* Activación y desactivación.
* Eliminación de registros.
* Filtros por nombre, deporte, categoría y estado.

### Jugadores

* Registro y edición de jugadores.
* Consulta detallada mediante modal.
* Activación y desactivación.
* Eliminación de registros.
* Filtro por equipo.
* Posiciones dinámicas según el deporte.
* Soporte para estudiantes y participantes externos.

### Torneos

* Registro de torneos.
* Administración de información.
* Consulta detallada.
* Cambio de estado.

### Partidos

* Programación de encuentros.
* Registro de resultados.
* Consulta y filtrado.
* Actualización automática de estado.

### Dashboard

* Estadísticas generales.
* Equipos registrados.
* Jugadores registrados.
* Torneos activos.
* Resumen de partidos.

---

## Seguridad

El sistema utiliza:

* Firebase Authentication para autenticación de usuarios.
* Roles de administrador y usuario.
* Reglas de Firestore para restringir operaciones sensibles.
* Validaciones reutilizables para formularios.

---

## Dependencias externas

| Dependencia             | Uso                             |
| ----------------------- | ------------------------------- |
| Bootstrap 5             | Componentes visuales e interfaz |
| Firebase Authentication | Gestión de usuarios             |
| Cloud Firestore         | Base de datos NoSQL             |
| Bootstrap Icons         | Iconografía                     |

---

## Colecciones principales

* `users`
* `teams`
* `players`
* `tournaments`
* `matches`

```
```

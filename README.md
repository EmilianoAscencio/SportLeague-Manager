# SportLeague Manager

Aplicación web para administrar una liga o torneo deportivo universitario. El sistema permite manejar equipos, jugadores, torneos, partidos y resultados usando JavaScript directo con Firebase.

## Tecnologías

- HTML
- CSS
- JavaScript
- Bootstrap
- Firebase Authentication
- Firestore Database

## Estructura

```text
public/
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── teams.html
├── players.html
├── tournaments.html
├── matches.html
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        ├── firebase.js
        ├── auth.js
        ├── firestore.js
        ├── validators.js
        ├── ui.js
        ├── teams.js
        ├── players.js
        ├── tournaments.js
        └── matches.js
```

## Módulos

### Autenticación

- Registro de usuarios.
- Inicio de sesión.
- Cierre de sesión.
- Protección de páginas privadas.
- Rol de usuario administrador.

### Dashboard

- Total de equipos.
- Total de jugadores.
- Total de torneos.
- Partidos programados.
- Partidos jugados.
- Accesos rápidos a módulos principales.

### Equipos

- Registrar equipos.
- Listar equipos.
- Ver detalle.
- Editar información.
- Activar o desactivar.
- Eliminar.
- Buscar y filtrar.
- Ver jugadores y partidos recientes del equipo.

### Jugadores

- Registrar jugadores.
- Listar jugadores.
- Ver ficha completa.
- Editar información.
- Activar o desactivar.
- Eliminar.
- Buscar por nombre.
- Filtrar por equipo.

### Torneos

- Crear torneos.
- Listar torneos.
- Ver detalle.
- Editar información.
- Cambiar estado.
- Eliminar.
- Ver partidos asociados.

### Partidos

- Programar partidos.
- Listar partidos.
- Filtrar por torneo y estado.
- Registrar marcador final.
- Cambiar estado a jugado al capturar resultado.

## Validaciones

El proyecto usa funciones reutilizables para validar:

- campos obligatorios;
- correo electrónico;
- longitud mínima;
- fechas;
- números positivos;
- números enteros mayores o iguales a cero;
- número de camiseta;
- duplicados cuando aplica.

## Firebase

El proyecto usa Firebase Authentication para usuarios y Firestore como base de datos.

Colecciones principales:

- `users`
- `teams`
- `players`
- `tournaments`
- `matches`

También se incluye `firestore.rules` para restringir operaciones de escritura a usuarios administradores.

## Cómo correr el proyecto

Desde la carpeta del proyecto se puede levantar un servidor local:

```bash
python3 -m http.server 5173 -d public
```

Luego abrir:

```text
http://localhost:5173/
```

## Documentación

La carpeta `docs/` contiene:

- historias de usuario del Sprint 1;
- historias de usuario del Sprint 2;
- pruebas manuales del Sprint 1.

## Estado general

El proyecto ya cuenta con autenticación, CRUDs principales, dashboard, validaciones, conexión con Firestore y reglas básicas de seguridad.

Quedan pendientes algunas mejoras finales como tabla de posiciones, equipo líder en dashboard y edición/cancelación de partidos programados.

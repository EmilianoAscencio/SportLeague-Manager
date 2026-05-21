# SportLeague Manager

Aplicación web para administrar ligas deportivas. El Sprint 1 cubre autenticación con Firebase, navegación privada, equipos, jugadores, torneos, validaciones reutilizables y documentación de pruebas.

## Ejecutar Localmente

Desde la raíz del repo:

```bash
python3 -m http.server 8080
```

Abrir:

```text
http://localhost:8080/public/
```

## Documentación

- `docs/HISTORIAS_USUARIO_SPRINT1.md`
- `docs/PRUEBAS_MANUALES.md`

## Módulos Principales

- Autenticación: `login.html`, `register.html`, `assets/js/auth.js`
- Equipos: `teams.html`, `assets/js/teams.js`
- Jugadores: `players.html`, `assets/js/players.js`
- Torneos: `tournaments.html`, `assets/js/tournaments.js`
- Utilidades: `validators.js`, `ui.js`, `firestore.js`

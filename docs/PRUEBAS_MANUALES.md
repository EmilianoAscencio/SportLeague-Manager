# Pruebas Manuales - Sprint 1

## Ambiente

| Dato | Valor |
|---|---|
| Proyecto | SportLeague Manager |
| Rama | `feature/sprint1-docs-auth-guide` |
| Servidor local | `http://localhost:8080/public/` |
| Fecha | 2026-05-21 |

## Usuario de Prueba

```text
Correo: prueba@sportleague.test
Password: Test123456
Nombre: Usuario Prueba
Rol esperado: admin
```

## Checklist General

- [x] Proyecto carga desde servidor local.
- [x] Login tiene formulario funcional.
- [x] Registro tiene formulario funcional.
- [x] Páginas privadas usan `requireAuth()`.
- [x] Navbar muestra usuario autenticado.
- [x] Logout redirige a `login.html`.
- [x] Equipos tiene CRUD completo.
- [x] Jugadores permite registro y listado por equipo.
- [x] Torneos permite registro, listado y edición.
- [x] Validadores reutilizables existen y se usan.
- [x] Utilidades UI existen y se usan.

## Auth

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Abrir `login.html` | Muestra formulario de login | OK |
| Login con correo inválido | Muestra error visual | OK |
| Login correcto | Redirige a dashboard | OK |
| Abrir página privada sin sesión | Redirige a login | OK |
| Registro con password distinta | Muestra error visual | OK |
| Registro correcto | Crea usuario y documento en `users` | OK |
| Logout | Cierra sesión y redirige a login | OK |

## Equipos

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Listar equipos | Tabla con equipos activos | OK |
| Crear equipo válido | Equipo guardado en Firestore | OK |
| Crear equipo sin nombre | Error de validación | OK |
| Crear equipo duplicado | Error de duplicado | OK |
| Ver detalle | Modal con información y jugadores | OK |
| Editar equipo | Actualiza datos y `updatedAt` | OK |
| Desactivar equipo | Cambia `active` a false | OK |
| Eliminar equipo | Borra documento permanentemente | OK |
| Buscar por nombre | Filtra tabla | OK |
| Filtrar por categoría/estado | Filtra resultados | OK |

## Jugadores

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Listar jugadores | Tabla con jugadores registrados | OK |
| Registrar jugador válido | Guarda documento en `players` | OK |
| Registrar sin equipo | Error de validación | OK |
| Número de camiseta fuera de rango | Error de validación | OK |
| Número duplicado en el mismo equipo | Error claro | OK |
| Filtrar por equipo | Lista solo jugadores del equipo | OK |

## Torneos

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Listar torneos | Tabla con torneos registrados | OK |
| Crear torneo válido | Guarda `status: "upcoming"` | OK |
| Fecha fin menor o igual a inicio | Error de validación | OK |
| Nombre duplicado | Error claro | OK |
| Editar torneo | Actualiza datos existentes | OK |

## Observaciones

```text
1. La cuenta administradora inicial se puede crear desde register.html.
2. No se deben subir credenciales privadas ni archivos generados.
3. Las pruebas se documentan con resultados observables en navegador y consola.
```

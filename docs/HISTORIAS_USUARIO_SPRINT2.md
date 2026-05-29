# Historias de Usuario - Sprint 2

Este documento resume las historias del PDF `Sprint2_SportLeagueManager.pdf` en un formato más fácil de revisar y demostrar.

## Objetivo del Sprint

Ampliar SportLeague Manager con manejo más completo de equipos, jugadores, torneos y partidos. En este sprint se agregan filtros, detalles, edición, estados, resultados, métricas del dashboard, historial reciente y control de permisos por rol.

## Lista General

| ID | Historia |
|---|---|
| HU-26 | Seleccionar deporte antes de categoría en equipos |
| HU-27 | Filtrar equipos por deporte |
| HU-28 | Tipo de participante estudiante/externo |
| HU-29 | Posiciones de jugador según deporte del equipo |
| HU-30 | Ficha completa del jugador |
| HU-31 | Editar jugador |
| HU-32 | Activar/desactivar jugador |
| HU-33 | Eliminar jugador permanentemente |
| HU-34 | Buscar jugadores por nombre |
| HU-35 | Validar fechas ilógicas de torneo |
| HU-36 | Eliminar torneo |
| HU-37 | Ver detalle de torneo y partidos asociados |
| HU-38 | Cambiar estado de torneo |
| HU-39 | Programar partido |
| HU-40 | Ver y filtrar partidos |
| HU-41 | Editar partido programado |
| HU-42 | Cancelar partido programado |
| HU-43 | Registrar marcador final |
| HU-44 | Tabla de posiciones por torneo |
| HU-45 | Equipo líder en dashboard |
| HU-46 | Separar partidos programados y jugados en dashboard |
| HU-47 | Acceso rápido para programar partido desde dashboard |
| HU-48 | Validador `validateNonNegativeInteger` |
| HU-49 | Partidos recientes en detalle del equipo |
| HU-50 | Control de permisos para rol admin |

## Detalle de Historias

### HU-26 - Deporte antes de categoría

Agregar el campo deporte al registrar y editar equipos. La categoría debe actualizarse dinámicamente según el deporte seleccionado.

Esto evita combinaciones incoherentes, por ejemplo registrar un equipo de voleibol con una categoría que no aplica.

### HU-27 - Filtro por deporte

Agregar un filtro de deporte en el módulo de equipos. Este filtro debe trabajar junto con los filtros existentes de categoría y estado.

### HU-28 - Tipo de participante

Agregar el campo `participantType`, con valores como `Estudiante` y `Externo`.

Cuando el jugador es estudiante, se muestra la matrícula. Cuando es externo, la matrícula se oculta y se guarda como `null`.

### HU-29 - Posiciones según deporte

El sistema debe mostrar posiciones distintas según el deporte del equipo seleccionado.

Ejemplos:

- Fútbol: Portero, Defensa, Mediocampista, Delantero.
- Baloncesto: Base, Escolta, Alero, Ala-Pívot, Pívot.
- Voleibol: Colocador, Opuesto, Receptor, Central, Líbero.

### HU-30 - Ficha completa del jugador

Agregar un modal de detalle para consultar la información completa de un jugador sin entrar al modo edición.

La ficha muestra nombre, equipo, deporte, tipo, posición, número, estado, matrícula cuando aplica y fecha de registro.

### HU-31 - Editar jugador

Permitir editar equipo, nombre, tipo de participante, matrícula, posición y número de camiseta.

También valida que el número de camiseta no se repita dentro del mismo equipo.

### HU-32 - Activar/desactivar jugador

Agregar una acción para cambiar el estado del jugador entre activo e inactivo sin eliminarlo permanentemente.

Esto permite conservar el registro histórico.

### HU-33 - Eliminar jugador

Permitir eliminación permanente con confirmación previa para evitar borrar datos por accidente.

### HU-34 - Buscar jugadores

Agregar búsqueda en tiempo real por nombre de jugador. Conforme se escribe, la tabla debe filtrarse automáticamente.

### HU-35 - Validación de fechas de torneo

Agregar validaciones para impedir fechas ilógicas:

- La fecha de fin no puede ser anterior a la fecha de inicio.
- El año debe estar en un rango razonable.

### HU-36 - Eliminar torneo

Permitir eliminar un torneo de forma permanente con confirmación previa.

### HU-37 - Detalle de torneo

Agregar un modal de detalle del torneo. Debe mostrar información general del torneo y sus partidos asociados.

### HU-38 - Estado del torneo

Permitir modificar el estado de un torneo entre próximo, en curso, finalizado o cancelado.

### HU-39 - Programar partido

Crear el módulo de partidos con formulario para registrar:

- torneo;
- equipo local;
- equipo visitante;
- fecha;
- hora;
- sede opcional.

El sistema valida que el equipo local y visitante sean diferentes.

### HU-40 - Lista y filtros de partidos

Mostrar una tabla con todos los partidos registrados. También debe permitir filtrar por torneo y estado.

### HU-41 - Editar partido programado

Permitir editar los datos de un partido solo cuando el estado sea `scheduled`.

### HU-42 - Cancelar partido programado

Agregar una acción para cambiar el estado de un partido programado a `cancelled`.

### HU-43 - Registrar marcador final

Agregar un modal para registrar el marcador final de un partido programado.

Al guardar el marcador:

- se valida que ambos marcadores sean enteros mayores o iguales a cero;
- se guardan `homeScore` y `awayScore`;
- el partido cambia a estado `played`.

### HU-44 - Tabla de posiciones

Calcular puntos, partidos jugados, ganados, empatados, perdidos y diferencia de goles por torneo.

### HU-45 - Equipo líder en dashboard

Calcular el equipo con más puntos y mostrarlo en una tarjeta del dashboard.

### HU-46 - Métricas separadas de partidos

Separar la métrica de partidos en el dashboard en:

- partidos programados;
- partidos jugados.

La finalidad es entender rápidamente cuántos partidos siguen programados y cuántos ya tienen resultado.

### HU-47 - Acceso rápido para programar partido

Agregar en el dashboard un botón de acceso rápido hacia el módulo de partidos.

La finalidad es agilizar el flujo normal de trabajo del administrador.

### HU-48 - Validador de enteros mayores o iguales a cero

Crear una función reusable:

```js
validateNonNegativeInteger(value)
```

Esta función debe validar marcadores como `0`, `1`, `2`, etc. Debe rechazar valores vacíos, negativos, decimales o texto.

Su uso principal es la captura de marcadores de partidos.

### HU-49 - Partidos recientes del equipo

Agregar una sección de partidos recientes en el modal de detalle del equipo.

El sistema debe buscar partidos donde el equipo aparezca como local o visitante, ordenarlos por fecha y hora, y mostrar los más recientes.

### HU-50 - Control de rol admin

Implementar control de permisos en dos niveles:

1. En el frontend:
   - se ocultan botones de escritura para usuarios no admin;
   - se bloquean funciones de crear, editar, eliminar, activar/desactivar y registrar resultados.

2. En Firestore:
   - se deben definir reglas de seguridad;
   - solo usuarios autenticados con `role: "admin"` y `active !== false` pueden escribir en `teams`, `players`, `tournaments` y `matches`.

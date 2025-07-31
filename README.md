# Prueba Técnica — Sistema de Gestión de Tareas

**Autor:** [juanjua1](https://github.com/juanjua1)

---

## Descripción

Entrega para la prueba técnica: **Sistema de Gestión de Tareas**.  
El proyecto consiste en una aplicación web full-stack que permite administrar tareas, usuarios y categorías, con distintos niveles de acceso y funcionalidades avanzadas.  
Incluye frontend con **React/Next.js**, backend con **Node.js/Nest.js/PostgreSQL**, autenticación segura, containerización con Docker y roles diferenciados.

---

## Características

### Frontend (React / Next.js)
- **Dashboard de tareas:** Visualiza tareas por estado y categoría.
- **Formulario de tareas:** Crear/editar tareas con validación y feedback.
- **Filtros:** Completadas, pendientes, por categoría.
- **Interfaz responsive:** Usable en móvil, tablet y escritorio.
- **Manejo de estados:** Loading y errores visuales.

### Backend (Node.js / Nest.js / PostgreSQL)
- **API REST:** Endpoints CRUD para tareas, usuarios y categorías.
- **Modelos robustos:** Usuario, Tarea, Categoría; con relaciones.
- **Validaciones:** Verifica datos de entrada y errores claros.
- **Paginación:** Consultas paginadas en listados extensos.
- **Autenticación:** JWT/session, middleware de protección y autorización.
- **Protección de rutas:** Tanto en frontend como backend.

### Containerización
- **Dockerfile frontend y backend:** Fácil despliegue y desarrollo local.
- **docker-compose.yml:** Levanta toda la aplicación y base de datos.
- **Variables de entorno:** Configuradas para separar credenciales y secretos.

### Roles y Bonus
- **Usuario común:** Crear/editar tareas.
- **Usuario premium:** Acceso a grupos de tareas, listas de seguimiento y funciones avanzadas.
- **Integración opcional:** Keycloak para autenticación empresarial.

---

## Tecnologías

- **Frontend:** TypeScript, React, Next.js, Tailwind CSS.
- **Backend:** Node.js, Nest.js (o Express.js), TypeScript.
- **Base de datos:** PostgreSQL.
- **Autenticación:** JWT y opción Keycloak.
- **DevOps:** Docker, docker-compose.

---

## Estructura del Proyecto

```
word-coneccion/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Instalación y Ejecución

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/juanjua1/word-coneccion.git
   cd word-coneccion
   ```

2. **Configura las variables de entorno:**
   - Copia `.env.example` a `.env` y completa los valores necesarios.

3. **Levanta la aplicación con Docker:**
   ```bash
   docker-compose up --build
   ```
   Esto inicia frontend, backend y base de datos PostgreSQL.

4. **Accede a la aplicación:**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend (API):** [http://localhost:4000/api](http://localhost:4000/api)

---

## Variables de Entorno

- `DATABASE_URL` — conexión a PostgreSQL
- `JWT_SECRET` — clave para tokens JWT
- `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` — (si se usa Keycloak)

---

## Endpoints Principales (API)

- `GET /api/tasks` — Listado paginado y filtrado de tareas
- `POST /api/tasks` — Crear tarea
- `PUT /api/tasks/:id` — Editar tarea
- `DELETE /api/tasks/:id` — Eliminar tarea
- `GET /api/categories` — Listado de categorías
- `POST /api/login` — Autenticación de usuario
- `GET /api/users` — Listado de usuarios (solo admin/premium)

---

## Roles y Permisos

- **Usuario común:**  
  Crear/editar/eliminar sus tareas. Visualiza solo su contenido.
- **Usuario premium:**  
  Acceso a grupos de tareas, listas de seguimiento y funciones extra.
- **Administrador:**  
  Control total sobre usuarios, tareas y categorías.

---

## Bonus y Puntos Extra

- **Keycloak:** Integración opcional para autenticación empresarial.
- **Gestión avanzada:** Grupos y listas de tareas solo para usuarios premium.
- **Interfaz de roles:** Visualización y asignación clara de permisos.

---

## Notas Técnicas

- Todo el código es **TypeScript**.
- Modularidad y escalabilidad.
- Ejemplos de pruebas unitarias y de integración.
- Interfaz adaptativa y accesible.

---

## Licencia

Entrega como prueba técnica.  
Uso libre para evaluación y fines educativos.

---

**¡Muchas gracias por la oportunidad!**

Para cualquier consulta sobre el proyecto, por favor contactar a: joseebocci@gmail.com

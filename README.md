# Barber Reservation Backend

API REST para gestionar usuarios, barberos, servicios, horarios y citas de una barbería. Está construida con Node.js, TypeScript, Express, Sequelize y PostgreSQL.

## Requisitos

- Node.js y npm
- PostgreSQL
- Una cuenta de Cloudinary para las imágenes

## Instalación

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y completa las variables:

   ```powershell
   Copy-Item .env.example .env
   ```

   | Variable | Descripción |
   | --- | --- |
   | `PORT` | Puerto HTTP del servidor. Por defecto: `3000`. |
   | `DATABASE_URL` | URL de conexión a PostgreSQL, por ejemplo `postgres://usuario:contraseña@localhost:5432/barber`. |
   | `JWT_SECRET` | Secreto privado usado para firmar y verificar tokens. |
   | `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary. |
   | `CLOUDINARY_API_KEY` | API key de Cloudinary. |
   | `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |

   Las variables de Cloudinary son necesarias para iniciar el servidor, aunque no se estén subiendo imágenes.

3. Inicia el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   La API queda disponible en `http://localhost:3000` (o en el puerto indicado por `PORT`). Al iniciar, Sequelize se conecta a PostgreSQL y sincroniza las tablas definidas por los modelos.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Ejecuta el servidor con recarga automática mediante `tsx watch`. |
| `npm run build` | Compila el proyecto con TypeScript. |
| `npm start` | Ejecuta `node dist/main.js`. |

El script `start` espera que la compilación genere `dist/main.js`.

## Base de datos

Además de las tablas de los modelos, las operaciones de citas requieren objetos SQL en PostgreSQL: la función `public.create_appointment(...)` para crear una cita y la tabla `appointment_status_history` para registrar cambios de estado. `sequelize.sync()` no crea estos objetos; deben estar preparados en la base de datos antes de usar esas operaciones. Este repositorio no incluye migraciones ni scripts SQL para ellos.

## Autenticación

Las rutas protegidas reciben el token JWT en el encabezado:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

El token se obtiene en `POST /auth/login` y tiene una duración de una hora. Los roles usados por la API son `customer`, `barber` y `admin`; algunas operaciones requieren un rol específico.

## API

La respuesta del endpoint raíz `GET /` confirma que el servidor está activo.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Público | Registra un cliente. Requiere `name`, `email` y `password` (mínimo 8 caracteres); `phone` es opcional. |
| `POST` | `/auth/login` | Público | Inicia sesión con `email` y `password`; devuelve un token JWT. |
| `GET` | `/auth/me` | Token | Obtiene el usuario autenticado. |
| `GET` | `/users` | Token | Lista usuarios. |
| `GET` | `/services` | Público | Lista servicios activos. |
| `GET` | `/services/:id` | Público | Obtiene un servicio por ID. |
| `POST` | `/services` | Barbero | Crea un servicio; acepta `name`, `price`, `duration_minutes`, `description` opcional y una imagen opcional. Para la imagen, usa `multipart/form-data` con el campo `image`. |
| `PUT` | `/services/:id` | Barbero | Actualiza un servicio. |
| `PUT` | `/services/deleted/:id` | Barbero | Desactiva un servicio. |
| `GET` | `/barbers` | Público | Lista barberos activos. |
| `GET` | `/barbers/:id` | Público | Obtiene un barbero por ID. |
| `POST` | `/barbers` | Barbero | Crea un perfil de barbero; acepta `name`, `email`, `password_hash`, `phone` opcional e imagen opcional (`multipart/form-data`, campo `image`). |
| `PUT` | `/barbers/:id` | Barbero | Actualiza un barbero. |
| `PUT` | `/barbers/deleted/:id` | Barbero | Desactiva un barbero. |
| `GET` | `/barbers/:id/schedules` | Token | Lista los horarios de un barbero. |
| `POST` | `/barbers/:id/schedules` | Token | Crea un horario con `day_of_week` (0 domingo–6 sábado), `start_time` y `end_time`. |
| `PUT` | `/barbers/:id/schedules/:scheduleId` | Público | Actualiza un horario. |
| `DELETE` | `/barbers/:id/schedules/:scheduleId` | Público | Elimina un horario. |
| `GET` | `/barbers/:id/availability?date=YYYY-MM-DD` | Público | Consulta horarios y citas reservadas del barbero para una fecha. |
| `GET` | `/appointments` | Token | Lista citas según el rol del usuario autenticado. |
| `POST` | `/appointments` | Cliente | Solicita una cita con `barber_id`, `service_id` y `starts_at`; `customer_notes` es opcional. |
| `GET` | `/appointments/availables?barber_id=:id&service_id=:id&date=YYYY-MM-DD` | Token | Consulta horas disponibles para un servicio, barbero y fecha. |
| `PATCH` | `/appointments/:id/confirm` | Barbero | Confirma una cita pendiente. |
| `PATCH` | `/appointments/:id/cancel` | Cliente o barbero | Cancela una cita pendiente o confirmada propia. |
| `PATCH` | `/appointments/:id/complete` | Barbero | Marca una cita confirmada como completada. |
| `PATCH` | `/appointments/:id/no-show` | Barbero | Registra que el cliente no asistió, después de 15 minutos desde el inicio. |

`starts_at` debe ser una fecha y hora válida. La disponibilidad y las reservas se manejan con la zona horaria de Bogotá (UTC-5).

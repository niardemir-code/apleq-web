# Guía de Sincronización y Esquema de Firebase Firestore para App Android

Este documento detalla la estructura completa de datos, nombres de campos (CamelCase y snake_case), tipos, valores predeterminados y reglas de lógica de negocio sincronizadas en **Cloud Firestore** entre la aplicación Web y la aplicación Android.

---

## 1. Arquitectura de Rutas en Firestore

| Nivel | Ruta en Firestore | Tipo de Almacenamiento | Descripción |
| :--- | :--- | :--- | :--- |
| **Documento Principal** | `users/{userId}/subscriptions/{subscriptionId}` | Documento Firestore | Almacena todos los datos de la suscripción y el array embebido `members: [ {...} ]`. |
| **Subcolección Granular** | `users/{userId}/subscriptions/{subscriptionId}/members/{memberId}` | Subcolección de Documentos | Documento individual para cada co-suscriptor (ideal para mapeo directo con Room en Android). |

---

## 2. Esquema de Suscripción Principal (`Subscription`)

**Ubicación Firestore:** `users/{userId}/subscriptions/{subscriptionId}`

| Campo (CamelCase) | Alias (snake_case) | Tipo de Dato | Valor por Defecto | Ejemplo / Rango | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | `String` / `Long` | *Obligatorio* | `"1719200000000"` | Identificador único de la suscripción. |
| `userId` | `user_id` | `String` | *Obligatorio* | `"wXYZ12345Auth"` | UID del usuario de Firebase Auth propietario. |
| `platformName` | `platform_name`, `name` | `String` | `""` | `"Netflix"`, `"Spotify"` | Nombre del servicio o suscripción. |
| `mainUserName` | `main_user_name` | `String` | `""` | `"Carlos"` | Nombre del titular / administrador principal. |
| `mainUserContact` | `main_user_contact` | `String` | `""` | `"carlos@email.com"` | Contacto del titular (email o teléfono). |
| `category` | `category` | `String` | `"Otros"` | `"Streaming"`, `"Música"` | Categoría temática del servicio. |
| `cost` | `cost` | `Double` | `0.0` | `17.99` | Coste total recurrente pagado por el titular. |
| `currency` | `currency` | `String` | `"EUR"` | `"EUR"`, `"USD"`, `"TRY"` | Código ISO (3 letras) de la moneda. |
| `billingPeriod` | `billing_period` | `String` | `"MONTHLY"` | `"MONTHLY"`, `"YEARLY"` | Frecuencia de cobro (`MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `YEARLY`). |
| `billingDay` | `billing_day` | `Int` | `1` | `1` a `31` | Día del mes en que se realiza la renovación. |
| `billingMonth` | `billing_month` | `Int` | `null` | `1` a `12` | Mes de renovación para períodos anuales o semestrales. |
| `defaultContributionPerUser` | `default_contribution` | `Double` | `0.0` | `4.50` | Aporte sugerido por co-suscriptor. |
| `platformPricing` | `platform_pricing` | `String` | `""` | `"Sharesub:3.50:EUR:MONTHLY"` | Precios por plataforma serializados con delimitador `\|`. |
| `iconType` | `icon_type` | `String` | `"PRESET"` | `"PRESET"`, `"VECTOR"`, `"CUSTOM_IMAGE"` | Tipo de icono utilizado. |
| `iconKey` | `icon_key` | `String` | `"globe"` | `"netflix"`, `"spotify"`, `"film"` | Clave o identificador del icono. |
| `iconColorHex` | `icon_color_hex` | `String` | `"#6366F1"` | `"#EF4444"`, `"#10B981"` | Color temático en formato Hexadecimal. |
| `notes` | `notes` | `String` | `""` | `"Plan 4K Familiar"` | Notas o detalles adicionales. |
| `members` | `members` | `List<Map>` | `[]` | `[ {...}, {...} ]` | Lista de mapas con todos los co-suscriptores. |
| `createdAt` | `created_at` | `Long` / `String` | *Timestamp actual* | `1719200000000` | Marca de tiempo de creación. |
| `updatedAt` | `updated_at` | `String` / `Long` | *Timestamp actual* | `"2026-08-22T04:25:00.000Z"` | Marca de tiempo de última actualización. |

---

## 3. Esquema del Co-Suscriptor / Miembro (`Member`)

**Ubicación Firestore:** 
- Elemento dentro del array `members` en `users/{userId}/subscriptions/{subscriptionId}`
- Documento en subcolección `users/{userId}/subscriptions/{subscriptionId}/members/{memberId}`

### 3.1. Identificación y Datos Personales

| Campo (CamelCase) | Alias (snake_case) | Tipo de Dato | Valor por Defecto | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | `String` / `Long` | *Obligatorio* | `"1"`, `"member_9876"` | Identificador único del miembro. |
| `subscriptionId` | `subscription_id` | `String` / `Long` | *Obligatorio* | `"1719200000000"` | ID de la suscripción padre a la que pertenece. |
| `memberName` | `member_name`, `name` | `String` | `"Miembro"` | `"s72b10 (Subli)"` | **Nombre completo del co-suscriptor** (sin truncar). |
| `sharingPlatform` | `sharing_platform`, `platform` | `String` | `"Sharesub"` | `"Sharesub"`, `"Spliiit"` | Plataforma de origen o gestión compartida. |
| `memberContact` | `member_contact`, `contact` | `String` | `""` | `"usuario@gmail.com"` | Correo, teléfono o usuario de contacto. |
| `contributionAmount` | `amount` | `Double` | `0.0` | `2.25`, `4.50` | Cuota individual que aporta periódicamente. |
| `currency` | `currency` | `String` | `null` | `"EUR"`, `"USD"` | Moneda del aporte individual (si difiere de la principal). |
| `notes` | `notes` | `String` | `""` | `"Pagó por Bizum"` | Observaciones particulares del miembro. |

---

### 3.2. Banderas de Estado y Alertas Visuales

| Campo (CamelCase) | Alias (snake_case) | Tipo de Dato | Valor por Defecto | Color en UI | Descripción y Significado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `isPaidThisMonth` | `is_paid_this_month` | `Boolean` | `true` | **Verde** | **Al día / Pagado**: El usuario está al corriente de pago y sin alertas. |
| `isPendingPayment` | `is_pending_payment` | `Boolean` | `false` | **Amarillo / Ámbar** | **Pendiente de pago**: Alerta visual para reclamar cuota pendiente. |
| `isPendingRemoval` | `is_pending_removal` | `Boolean` | `false` | **Rojo / Rosa** | **Pendiente eliminar**: Alerta visual para dar de baja / expulsar miembro. |
| `isPendingRegistration` | `is_pending_registration` | `Boolean` | `false` | **Azul / Celeste** | **Pendiente dar de alta**: Alerta visual para registrar invitación / perfil. |
| `paymentStatus` | `payment_status` | `String` | `"paid"` | — | Estado textual de sincronización (`"paid"`, `"pending"`, `"overdue"`). |

#### Reglas de Lógica de Negocio y Alternancia (Toggle):
1. **Exclusividad de Alertas**: Un usuario sólo puede tener una alerta activa a la vez:
   - Si se activa `isPendingPayment = true` $\rightarrow$ se desactivan `isPendingRemoval` y `isPendingRegistration`, y `isPaidThisMonth = false`.
   - Si se activa `isPendingRemoval = true` $\rightarrow$ se desactivan `isPendingPayment` y `isPendingRegistration`, y `isPaidThisMonth = false`.
   - Si se activa `isPendingRegistration = true` $\rightarrow$ se desactivan `isPendingPayment` y `isPendingRemoval`, y `isPaidThisMonth = false`.
2. **Desactivación / Vuelta a "Al Día"**:
   - Si el usuario presiona el estado que ya estaba activo (toggle off) o selecciona *"Al día / Pagado"*: los tres booleanos (`isPendingPayment`, `isPendingRemoval`, `isPendingRegistration`) se fijan en `false` y `isPaidThisMonth = true`.

---

### 3.3. Fechas, Frecuencia y Renovación Automática

| Campo (CamelCase) | Alias (snake_case) | Tipo de Dato | Formato / Rango | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `joinedDate` | `joined_date` | `String` | `YYYY-MM-DD` | `"2026-08-20"` | Fecha de alta o ingreso del usuario. |
| `nextPaymentDate` | `next_payment_date` | `String` | `YYYY-MM-DD` | `"2026-09-20"` | Próxima fecha calculada o asignada de pago. |
| `paymentFrequencyValue` | `payment_frequency_value` | `Int` | `1` a `365` | `1`, `3`, `6`, `12` | Magnitud numérica de la frecuencia de pago. |
| `paymentFrequencyUnit` | `payment_frequency_unit` | `String` | Enum textual | `"months"` | Unidad de tiempo (`"days"`, `"weeks"`, `"months"`, `"years"`). |
| `autoRepeatPayment` | `auto_repeat_payment` | `Boolean` | Booleano | `true` | Si es `true`, al cumplirse la fecha se calcula automáticamente el próximo período. |
| `paymentMethod` | `payment_method` | `String` | Texto libre | `"Bizum"` | Método de pago acordado (`"Bizum"`, `"Transferencia"`, `"PayPal"`, etc.). |
| `lastPaymentDate` | `last_payment_date` | `String` | `YYYY-MM-DD` | `"2026-08-19"` | Fecha en la que se realizó el último cobro. |

---

### 3.4. Alarmas y Notificaciones Previas

| Campo (CamelCase) | Alias (snake_case) | Tipo de Dato | Valor por Defecto | Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `enableAlarm` | `enable_alarm`, `hasAlarm` | `Boolean` | `false` | `true` | Activa o desactiva las notificaciones del miembro. |
| `alarmValue` | `alarm_value` | `Int` | `3` | `1`, `2`, `3`, `7` | Cantidad de tiempo de antelación para la alarma. |
| `alarmUnit` | `alarm_unit` | `String` | `"days"` | `"days"` | Unidad de antelación (`"same_day"`, `"hours"`, `"days"`, `"weeks"`, `"months"`). |
| `alarmDaysBefore` | `alarm_days_before` | `Int` | `3` | `3` | Antelación normalizada en días enteros (retrocompatibilidad). |

---

## 4. Recomendaciones de Implementación para Kotlin / Android

### A. Mapeo de Entidad con Gson / Kotlinx Serialization
Para garantizar total compatibilidad con lecturas y escrituras tanto en formato `camelCase` como en `snake_case`, utiliza anotaciones con nombres alternativos en las Data Classes:

```kotlin
data class MemberEntity(
    @SerializedName("id")
    val id: String = "",

    @SerializedName("subscriptionId", alternate = ["subscription_id"])
    val subscriptionId: String = "",

    @SerializedName("memberName", alternate = ["member_name", "name"])
    val memberName: String = "",

    @SerializedName("sharingPlatform", alternate = ["sharing_platform", "platform"])
    val sharingPlatform: String = "Sharesub",

    @SerializedName("memberContact", alternate = ["member_contact", "contact"])
    val memberContact: String = "",

    @SerializedName("contributionAmount", alternate = ["amount"])
    val contributionAmount: Double = 0.0,

    @SerializedName("isPaidThisMonth", alternate = ["is_paid_this_month", "paidThisMonth"])
    val isPaidThisMonth: Boolean = true,

    @SerializedName("isPendingPayment", alternate = ["is_pending_payment"])
    val isPendingPayment: Boolean = false,

    @SerializedName("isPendingRemoval", alternate = ["is_pending_removal"])
    val isPendingRemoval: Boolean = false,

    @SerializedName("isPendingRegistration", alternate = ["is_pending_registration"])
    val isPendingRegistration: Boolean = false,

    @SerializedName("joinedDate", alternate = ["joined_date"])
    val joinedDate: String = "",

    @SerializedName("nextPaymentDate", alternate = ["next_payment_date"])
    val nextPaymentDate: String = "",

    @SerializedName("paymentFrequencyValue", alternate = ["payment_frequency_value"])
    val paymentFrequencyValue: Int = 1,

    @SerializedName("paymentFrequencyUnit", alternate = ["payment_frequency_unit"])
    val paymentFrequencyUnit: String = "months",

    @SerializedName("autoRepeatPayment", alternate = ["auto_repeat_payment"])
    val autoRepeatPayment: Boolean = true,

    @SerializedName("enableAlarm", alternate = ["enable_alarm", "hasAlarm"])
    val enableAlarm: Boolean = false,

    @SerializedName("alarmValue", alternate = ["alarm_value"])
    val alarmValue: Int = 3,

    @SerializedName("alarmUnit", alternate = ["alarm_unit"])
    val alarmUnit: String = "days"
)
```

### B. Formato Estricto de Fechas
- Todas las fechas (`joinedDate`, `nextPaymentDate`, `lastPaymentDate`) deben manejarse y persistirse en formato estándar **`YYYY-MM-DD`** (ej. `"2026-09-19"`).

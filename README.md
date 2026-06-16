# IA para tu Negocio · VeyharCorp

Demo de taller: escribes el nombre de un negocio y la IA **diseña un afiche
promocional de verdad** (nombre, eslogan, sticker de oferta, colores, hashtags
y texto listo para WhatsApp). La IA decide el diseño en JSON; la app lo pinta
con CSS. Patrón **Blueprint Engine**: la IA decide, la app renderiza.

## Arquitectura

```
public/index.html   → front estático (el afiche + las recetas de texto)
api/generate.js     → función serverless: guarda la API key, llama a Claude,
                      y registra el lead en Supabase (best-effort)
supabase/schema.sql → tabla `leads`
```

El navegador **nunca** llama a Anthropic directo (CORS + expondría la key).
Siempre pasa por `/api/generate`.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Llamar a Claude |
| `SUPABASE_URL` | No | Registrar leads del taller |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Escribir en la tabla `leads` (key secreta, solo servidor) |

Si dejas las de Supabase vacías, el demo funciona igual; solo no guarda leads.

## Correr local

```bash
npm i -g vercel        # si no lo tienes
cp .env.example .env.local   # y rellena tus llaves
vercel dev             # abre http://localhost:3000
```

## Supabase (1 vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega `supabase/schema.sql` → **Run**.
3. **Settings → API**: copia `Project URL` (→ `SUPABASE_URL`) y la
   `service_role` key (→ `SUPABASE_SERVICE_ROLE_KEY`).

## Deploy en Vercel

1. Sube este repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. **Environment Variables**: agrega las 3 variables de arriba.
4. **Deploy**. Vercel detecta `/api` (serverless) y sirve `/public` (estático).

## Después del taller

Los nombres que escribió la sala quedan en Supabase → tabla `leads`.
Para verlos: **Table Editor → leads**, o:

```sql
select negocio, tipo, creado_en from leads order by creado_en desc;
```

---
Creado por [Harvey Aquino](https://www.linkedin.com/in/harveyaquinomas/)

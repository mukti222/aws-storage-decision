# Setup sync HP A & HP B (Netlify + Upstash)

## Kenapa perlu Upstash?

Netlify Blobs kadang gagal di akun tertentu. **Upstash Redis gratis** dipakai sebagai penyimpanan cloud yang andal.

## Langkah (±5 menit)

### 1. Buat database Upstash

1. Buka https://console.upstash.com/ → login/daftar.
2. **Create Database** → pilih region dekat Anda → Create.
3. Tab **REST API** → copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Tambah di Netlify

1. https://app.netlify.com → pilih situs Anda.
2. **Site configuration** → **Environment variables** → **Add a variable**.
3. Tambahkan:

| Key | Value |
|-----|--------|
| `UPSTASH_REDIS_REST_URL` | (paste dari Upstash) |
| `UPSTASH_REDIS_REST_TOKEN` | (paste dari Upstash) |

4. **Save**.

### 3. Deploy ulang

**Deploys** → **Trigger deploy** → **Deploy site**.

### 4. Tes

1. Buka situs → analisis → buka **list perusahaan anda**.
2. Kotak status harus **hijau**: *Cloud Netlify · HP A & HP B...*
3. HP lain, URL sama → list sama.

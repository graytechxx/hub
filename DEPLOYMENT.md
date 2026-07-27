# Panduan Deploy LEPKOM Hub ke Server

Dokumen ini berisi panduan lengkap untuk melakukan *deployment* aplikasi **LEPKOM Hub** (React + Vite + TypeScript) di berbagai jenis server.

---

## 📋 Prasyarat Umum

* **Node.js**: v18.0.0 atau lebih baru (direkomendasikan v20+)
* **Git**: Terinstall di server
* **Web Server**: Nginx, Apache, atau Docker
* **Akses Server**: SSH & privileges sudo (untuk VPS/Linux Server)

---

## 🚀 Opsi 1: VPS / Server Linux (Nginx) - *Sangat Direkomendasikan*

### Step 1: Clone Repository & Build Project

```bash
# 1. Masuk ke direktori web server (misal: /var/www)
cd /var/www

# 2. Clone repository dari GitHub
sudo git clone https://github.com/graytechxx/hub.git lepkom-hub

# 3. Masuk ke folder proyek
cd lepkom-hub

# 4. Install dependensi
npm install

# 5. Build proyek untuk produksi
npm run build
```

Hasil build akan berada di dalam folder `/var/www/lepkom-hub/dist`.

---

### Step 2: Konfigurasi Nginx

Buat file konfigurasi Nginx baru:

```bash
sudo nano /etc/nginx/sites-available/lepkom-hub
```

Masukkan konfigurasi berikut (sesuaikan `domain_atau_ip_server` dengan domain/IP Anda):

```nginx
server {
    listen 80;
    server_name domain_atau_ip_server;

    root /var/www/lepkom-hub/dist;
    index index.html;

    # Gzip Compression untuk performa cepat
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    error_log  /var/log/nginx/lepkom_error.log;
    access_log /var/log/nginx/lepkom_access.log;
}
```

Aktifkan konfigurasi dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/lepkom-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Step 3: Pasang SSL (HTTPS) dengan Certbot (Opsional tapi Disarankan)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d domain_anda.com
```

---

## 🌐 Opsi 2: Apache Server / cPanel / Laragon Remote

Jika server Anda menggunakan **Apache** (seperti cPanel, Laragon Server, atau Ubuntu Apache):

1. **Build lokal atau di server**:
   ```bash
   npm run build
   ```
2. Pastikan file `.htaccess` berikut ada di root direktori domain Anda (sudah tersedia di repository ini):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Serve built assets dari dist
    RewriteCond %{REQUEST_URI} !^/dist/
    RewriteCond %{DOCUMENT_ROOT}/dist%{REQUEST_URI} -f [OR]
    RewriteCond %{DOCUMENT_ROOT}/dist%{REQUEST_URI} -d
    RewriteRule ^(.*)$ dist/$1 [L]

    # Fallback ke dist/index.html untuk React SPA routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ dist/index.html [L]
</IfModule>
```

---

## 🐳 Opsi 3: Deploy Menggunakan Docker

Jika Anda ingin menjalankan aplikasi di dalam container Docker:

### 1. Buat `Dockerfile` di root proyek:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve dengan Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Buat `nginx.conf` untuk container Docker:

```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Build & Run Container:

```bash
docker build -t lepkom-hub .
docker run -d -p 80:80 --name lepkom-hub-app lepkom-hub
```

---

## ☁️ Opsi 4: Deploy Gratis ke Cloud (Vercel / Netlify)

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Jalankan perintah di root proyek: `vercel`
3. Ikuti instruksi di layar (pilih framework: **Vite**).

### Netlify
1. Hubungkan repository GitHub [graytechxx/hub](https://github.com/graytechxx/hub) di dasbor Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Tambahkan file `public/_redirects` berisi `/* /index.html 200` agar SPA routing berjalan lancar.

---

## 🔄 Pembaruan Aplikasi di Server (Update Code)

Jika ada perubahan kode di masa mendatang, cukup jalankan perintah berikut di server VPS Anda:

```bash
cd /var/www/lepkom-hub
git pull origin main
npm install
npm run build
```

---

*Disusun untuk proyek **LEPKOM Hub**.*

# เพิ่มระบบสมัครสมาชิก + Login (NextAuth + Prisma + Credentials)

## ติดตั้งไลบรารี
```bash
npm i next-auth bcryptjs
# ถ้ายังไม่ได้ติดตั้ง prisma/client:
# npm i @prisma/client && npm i -D prisma
```

## ตั้งค่า .env
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32" # ใส่ค่านี้จริง
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

## อัปเดต Prisma schema และ migrate
```bash
npx prisma generate
npx prisma migrate dev --name auth
# หรือ:
# npx prisma db push
```

## รัน
```bash
npm run dev
```

- สมัครสมาชิก: `/register`
- เข้าสู่ระบบ: `/login`
- Header จะแสดงสถานะผู้ใช้ (Sign in/Sign out)

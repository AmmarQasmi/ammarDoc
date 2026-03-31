## Prisma Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Replace both `DATABASE_URL` (session pooler URL) and `DIRECT_URL` (direct DB URL) in `.env`.

4. Validate and generate Prisma client:

```bash
npm run prisma:validate
npm run prisma:generate
```

5. Push schema and seed demo data:

```bash
npm run prisma:push
npm run prisma:seed
```

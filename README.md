# Rawa7el Platform - رواحل

Turborepo monorepo containing two platforms:
- **بداية (Bedaya)** - Educational platform for Bedaya project
- **تحت العشرين (Taht El-Eshreen)** - Youth management platform

## Project Structure

```
rawa7el/
├── apps/
│   ├── bedaya/              # منصة بداية
│   └── taht-el-eshreen/     # منصة تحت العشرين (coming soon)
├── packages/
│   ├── database/            # Prisma schema + client
│   ├── exam-logic/          # Exam system (headless)
│   ├── attendance-logic/    # Attendance system (headless)
│   ├── notifications-logic/ # Notifications system (headless)
│   └── halaqat-logic/       # Halaqat system (headless)
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+

### Installation

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push database schema
pnpm db:push
```

### Development

```bash
# Run all apps
pnpm dev

# Run only Bedaya
pnpm dev:bedaya

# Run only Taht El-Eshreen
pnpm dev:taht
```

### Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

## Packages

### @rawa7el/database
Shared Prisma client and database schema.

### @rawa7el/exam-logic
Headless exam system with services for:
- Creating/managing exams
- Managing questions
- Handling submissions and grading

### @rawa7el/attendance-logic
Headless attendance system with services for:
- Creating attendance sessions
- Recording attendance
- Generating reports

### @rawa7el/notifications-logic
Headless notification system with services for:
- Sending notifications
- Broadcasting to roles
- Managing notification preferences

### @rawa7el/halaqat-logic
Headless halaqat (study circles) system with services for:
- Managing halaqat
- Enrolling students
- Tracking lessons and evaluations

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🔐 Credentials & Environment Variables

## Supabase (مشترك بين كل المنصات)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | رابط مشروع Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | المفتاح العام (Anon Key) |

---

## Google Drive (للـ Streaming)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_EMAIL` | إيميل Service Account من Google Cloud |
| `GOOGLE_PRIVATE_KEY` | المفتاح الخاص لـ Service Account |

---

## Platform URLs

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BEDAYA_URL` | رابط منصة بداية (default: `http://localhost:3003`) |

---

## Apps

### 📚 Bedaya (`apps/bedaya`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BEDAYA_URL=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

### 🎓 Taht El Eshreen (`apps/taht-el-eshreen`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

### 🌐 Portal (`apps/portal`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## ⚠️ ملاحظات مهمة

1. **لا تشارك هذه القيم في Git** - تأكد من إضافة `.env*` في `.gitignore`
2. **GOOGLE_PRIVATE_KEY** يجب أن يكون بين علامات تنصيص ويحتوي على `\n` للأسطر الجديدة
3. للحصول على Supabase Keys: اذهب إلى Project Settings > API في Supabase Dashboard
4. للحصول على Google Service Account: اذهب إلى Google Cloud Console > IAM & Admin > Service Accounts

# Nox Chat (Vercel Ready)

Next.js + MongoDB Atlas + Cloudinary version of Nox Chat.

**Features:**
- Login / Register
- Profile picture
- 1-to-1 Chat
- Photo sharing
- **View Once** photos
- Notifications
- Telegram → Owner
- BlackboxAI Help
- Fully works on **Vercel**

---

## 1. Accounts Banane Hain

### A. MongoDB Atlas (Free)
1. https://www.mongodb.com/cloud/atlas → Sign up
2. **Build a Database** → Free (M0)
3. Cluster create karo
4. **Database Access** → Add user (username + password)
5. **Network Access** → Add IP → `0.0.0.0/0` (allow all)
6. **Connect** → Drivers → Connection string copy karo  
   Example:  
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### B. Cloudinary (Free)
1. https://cloudinary.com → Sign up
2. Dashboard se **Cloud Name**, **API Key**, **API Secret** copy karo

### C. Telegram Bot
- @BotFather → `/newbot` → Token
- @userinfobot → Apna Chat ID

### D. BlackboxAI
- https://app.blackbox.ai → API Key

---

## 2. Project Setup

```bash
# Project folder mein
npm install

# .env.local banao
cp .env.example .env.local
```

`.env.local` mein values daalo:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=koi_lamba_random_secret_string
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_OWNER_ID=xxx
TELEGRAM_ENABLED=true
BLACKBOX_API_KEY=xxx
BLACKBOX_ENABLED=true
```

Local test:
```bash
npm run dev
```
→ http://localhost:3000

---

## 3. Vercel pe Deploy

1. GitHub pe repo push karo
2. https://vercel.com → New Project → Import repo
3. **Environment Variables** mein saari `.env` values daalo
4. Deploy

---

## Important Notes

- Photos Cloudinary pe store hoti hain (Vercel filesystem nahi)
- MongoDB Atlas use hota hai
- JWT cookie se auth hota hai
- View Once + AI + Telegram sab kaam karta hai

---

**Nox Chat is ready for Vercel 🚀**

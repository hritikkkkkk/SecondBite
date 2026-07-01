# 🍽️ SecondBite

> Transform unhappy diners into loyal customers before they leave your restaurant.

SecondBite is a modern **Restaurant Customer Experience Platform** that helps restaurants collect private customer feedback through QR codes, identify dissatisfied guests in real time, and protect their online reputation by resolving issues before they become public reviews.

---

## ✨ Features

### 📱 QR Code Feedback
- Unique QR code for every restaurant or table
- Instant mobile-friendly feedback form
- No app installation required

### ⭐ Smart Rating System
- 1–5 star rating
- Category-based ratings (Food, Service, Ambience, Cleanliness)
- Optional written feedback

### 🚨 Negative Review Detection
- Automatically detects low ratings
- Alerts restaurant staff immediately
- Enables instant issue resolution

### 💬 Customer Experience Dashboard
- Real-time feedback analytics
- Rating trends
- Review history
- Customer satisfaction insights

### 📊 Analytics
- Average rating
- Daily/Weekly/Monthly reports
- Feedback distribution
- Restaurant performance metrics

### 🔒 Secure Authentication
- Email authentication
- Google Sign-In
- Protected dashboard
- Secure user sessions

---

# 🚀 Why SecondBite?

Most unhappy customers never complain in person.

Instead, they leave...

⭐ 1-Star Google Reviews

SecondBite changes that.

Customers scan a QR code, share private feedback, and restaurants get the opportunity to fix problems before they become public.

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Backend

- Supabase
- PostgreSQL
- Authentication
- Row Level Security (RLS)

## Deployment

- Vercel

---

# 📸 Platform Workflow

```text
Customer Visits Restaurant
            │
            ▼
      Scan QR Code
            │
            ▼
   Submit Private Feedback
            │
            ▼
Low Rating? ──────────────► Staff Gets Alert
      │                          │
      ▼                          ▼
 Positive Review          Resolve Issue
      │                          │
      ▼                          ▼
Restaurant Improves Customer Experience
```

---

# 📂 Project Structure

```
secondbite/
│
├── app/
├── components/
├── lib/
├── hooks/
├── public/
├── styles/
├── types/
├── utils/
├── supabase/
├── middleware.ts
├── package.json
└── README.md
```

---

# ⚡ Getting Started

## Clone the repository

```bash
git clone https://github.com/yourusername/secondbite.git
```

## Install dependencies

```bash
npm install
```

## Configure environment variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Run locally

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

# 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public API Key |
| SUPABASE_SERVICE_ROLE_KEY | Service Role Key |

---

# 🎯 Target Users

- Restaurants
- Cafés
- Hotels
- Food Chains
- Cloud Kitchens
- Fine Dining Restaurants

---

# 🌟 Benefits

### For Restaurants

- Improve customer satisfaction
- Reduce negative public reviews
- Understand customer pain points
- Increase repeat customers
- Make data-driven decisions

### For Customers

- Fast and simple feedback
- No account required
- Better dining experiences
- Private communication with restaurants

---

# 🔮 Future Roadmap

- AI-powered sentiment analysis
- WhatsApp notifications
- Staff performance insights
- Multi-location management
- Customer loyalty integration
- AI-generated improvement suggestions
- Public review conversion
- Custom branding
- Multi-language support
- Enterprise analytics

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 💡 Vision

We believe every restaurant deserves a second chance before receiving a one-star review.

SecondBite empowers restaurants to listen, respond, and improve—creating better dining experiences for customers while helping businesses build stronger reputations.

---

## Built with ❤️ to make every dining experience better.

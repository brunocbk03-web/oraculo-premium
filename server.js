require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mercadopago = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// =====================
// MERCADO PAGO
// =====================
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

// =====================
// GOOGLE OAUTH
// =====================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// =====================
// AUTH ROUTES
// =====================
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    res.redirect('/premium');
  }
);

// =====================
// SUBSCRIPTION
// =====================
app.post('/create-subscription', async (req, res) => {
  try {
    const response = await mercadopago.preapproval.create({
      reason: 'Oráculo Premium',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 19.90,
        currency_id: 'BRL'
      },
      back_url: 'https://SEU_DOMINIO/premium',
      status: 'active'
    });

    res.json({ init_point: response.body.init_point });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// WEBHOOK
// =====================
app.post('/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.sendStatus(200);
});

// =====================
app.get('/', (req, res) => {
  res.send('Oráculo Premium online');
});

app.get('/premium', (req, res) => {
  res.send('Acesso Premium Liberado');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBSOCKET_PORT = 8080;

// API credentials (replace these with your actual credentials)
const USERNAME = process.env.username;
const PASSWORD = process.env.password;

// Authentication endpoint
const AUTH_ENDPOINT = 'https://api.kotaksecurities.com/oauth/token';

// API endpoints for fetching holdings, placing orders, etc.
const HOLDINGS_ENDPOINT = 'https://api.kotaksecurities.com/portfolio/v1/holdings';
const BUY_ORDER_ENDPOINT = 'https://api.kotaksecurities.com/orders/v1/buy';
const SELL_ORDER_ENDPOINT = 'https://api.kotaksecurities.com/orders/v1/sell';

// Additional APIs
const NEWS_API_ENDPOINT = 'https://api.kotaksecurities.com/news/v1/market';
const HISTORICAL_PRICES_API_ENDPOINT = 'https://api.kotaksecurities.com/historical-prices/v1';

// Middleware
app.use(bodyParser.json());

// Authenticate function
const authenticate = async () => {
  const response = await fetch(AUTH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      grant_type: 'password'
    })
  });
  const data = await response.json();
  return data.access_token;
};

// Fetch current holdings function
const fetchHoldings = async (accessToken) => {
  const response = await fetch(HOLDINGS_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.json();
};

// Place buy order function
const placeBuyOrder = async (accessToken, orderData) => {
  const response = await fetch(BUY_ORDER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};

// Place sell order function
const placeSellOrder = async (accessToken, orderData) => {
  const response = await fetch(SELL_ORDER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};

// Receive postback webhook
app.post('/postback', (req, res) => {
  // Handle postback data here
  const data = req.body;
  // Process postback data
  res.json({ message: 'Postback received' });
});

// WebSocket server configuration
const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Simulate sending real-time prices at intervals
  const priceInterval = setInterval(() => {
    const priceData = {
      symbol: 'XYZ', 
      price: (Math.random() * 1000).toFixed(2) 
    };
    // Send price data to connected clients
    ws.send(JSON.stringify(priceData));
  }, 3000);

  // Handle WebSocket close event
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    clearInterval(priceInterval); 
  });
});

// Endpoint to fetch stock market news
app.get('/news', async (req, res) => {
  try {
    const response = await fetch(NEWS_API_ENDPOINT);
    const newsData = await response.json();
    res.json(newsData);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Endpoint to retrieve historical stock prices
app.get('/historical-prices', async (req, res) => {
  try {
    const symbol = 'XYZ';
    const response = await fetch(`${HISTORICAL_PRICES_API_ENDPOINT}?symbol=${symbol}`);
    const historicalPricesData = await response.json();
    res.json(historicalPricesData);
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    res.status(500).json({ error: 'Failed to fetch historical prices' });
  }
});

// Authenticate user and start server
authenticate()
  .then((accessToken) => {
    console.log('Authentication successful');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Authentication failed:', error);
  });

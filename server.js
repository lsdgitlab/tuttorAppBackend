const express = require('express');
const cors = require('cors');
// const https = require('https');
require('dotenv').config();

const app = express();

app.use(cors({
//  origin: 'http://localhost:3000',
  origin: 'https://tuttor-app.vercel.app/',
  credentials: true
}));

app.use(express.json());

// function makeBackendlessRequest(method, path, body) {
//   return new Promise((resolve, reject) => {
//     const options = {
//       hostname: 'api.backendless.com',
//       path: `/${process.env.BACKENDLESS_APP_ID}/${process.env.BACKENDLESS_API_KEY}/${path}`,
//       method: method,
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     };

//     const req = https.request(options, (res) => {
//       let data = '';

//       res.on('data', (chunk) => {
//         data += chunk;
//       });

//       res.on('end', () => {
//         try {
//           const jsonData = JSON.parse(data);
//           resolve({ statusCode: res.statusCode, data: jsonData });
//         } catch (error) {
//           reject(new Error('Invalid JSON response'));
//         }
//       });
//     });

//     req.on('error', (error) => {
//       reject(error);
//     });

//     if (body) {
//       req.write(JSON.stringify(body));
//     }

//     req.end();
//   });

// }
app.post('/api/send-sms', async (req, res) => {
  const { mobile, otp } = req.body;
  
  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required' });
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.SMS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        route: "v3",
        sender_id: "TXTIND",
        message: `Your OTP is: ${otp}`,
        language: "english",
        numbers: mobile,
      })
    });

    const data = await response.json();
    console.log('SMS API Response:', data); // For debugging

    if (!response.ok || !data.return) {
      console.error('SMS API Error:', data);
      return res.status(response.status || 400).json({
        error: 'SMS sending failed',
        details: data.message || 'Unknown error'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('SMS Error:', error);
    res.status(500).json({ error: 'Failed to send SMS', details: error.message });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.EMAIL_API_KEY,
      },
      body: JSON.stringify({
        sender: { 
          name: process.env.EMAIL_SENDER_NAME || 'Your App Name', 
          email: process.env.EMAIL_SENDER_ADDRESS || 'noreply@yourdomain.com'
        },
        to: [{ email }],
        subject: "Registration Successful",
        htmlContent: "<p>Thank you for registering!</p> ",
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email API Error:', data);
      return res.status(response.status).json({
        error: 'Email sending failed',
        details: data.message || 'Unknown error'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// app.all('/api/backendless/*', async (req, res) => {
//   try {
//     const path = req.params[0];
//     console.log('Request:', {
//       method: req.method,
//       path: path,
//       body: req.body
//     });

//     const response = await makeBackendlessRequest(
//       req.method,
//       path,
//       ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null
//     );

//     console.log('Response:', response);
//     res.status(response.statusCode).json(response.data);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       error: 'Internal Server Error',
//       message: error.message
//     });
//   }
// });

// Test endpoint to verify environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    appIdPresent: !!process.env.BACKENDLESS_APP_ID,
    apiKeyPresent: !!process.env.BACKENDLESS_API_KEY,
    appIdLength: process.env.BACKENDLESS_APP_ID?.length,
    apiKeyLength: process.env.BACKENDLESS_API_KEY?.length
  });
});

// Environment variables test function
const EnvTest = () => {
  const smsKey = process.env.SMS_API_KEY;
  const emailKey = process.env.EMAIL_API_KEY;
  
  if (!smsKey) console.warn('Warning: SMS_API_KEY is not set in environment variables');
  if (!emailKey) console.warn('Warning: EMAIL_API_KEY is not set in environment variables');
  
  console.log('SMS_API_KEY:', smsKey ? '****' + smsKey.slice(-4) : 'Not set');
  console.log('EMAIL_API_KEY:', emailKey ? '****' + emailKey.slice(-4) : 'Not set');
}
EnvTest()

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    hasAppId: !!process.env.BACKENDLESS_APP_ID,
    hasApiKey: !!process.env.BACKENDLESS_API_KEY
  });
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Cancelled</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
    }
    .cancel-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      opacity: 0.9;
    }
    .note {
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="cancel-icon">❌</div>
    <h1>Payment Cancelled</h1>
    <p>Your payment was cancelled and no charges were made.</p>
    <p>You can try again anytime from the app.</p>
    <div class="note">
      <strong>You can close this page and return to the app.</strong>
    </div>
  </div>
  <script>
    // Auto-close after 3 seconds on mobile
    setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 3000);
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

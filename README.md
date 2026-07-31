# LAD Society UPIPay POC

Uses `upipay` (iamrobinsharaya/upipay).

## Run
```powershell
npm install
npm run install:all
copy backend\.env.example backend\.env
npm run dev
```

Open http://localhost:5173

## Real ₹1 QR test
Edit `backend/.env`:
```env
PAYMENT_MODE=qr
UPI_VPA=your-real-upi-id@bank
UPI_PAYEE_NAME=LAD Society Test
```
Restart the server, then use the ₹1 test bill.

QR mode sends real UPI money to your configured VPA but cannot automatically verify the payment.

For automatic verification, set PAYMENT_MODE to `phonepe` or `paytm`, add merchant credentials, and configure a public HTTPS `PUBLIC_BASE_URL`. Never commit `.env`.

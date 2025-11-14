# Client Management & Partial Payment Features

## Overview
This POS system now includes comprehensive client management with support for partial payments and pay-later transactions.

## New Features

### 1. Client Management
- **Add New Clients**: Create client profiles with name, phone, email, and address
- **View All Clients**: See all clients with their outstanding balances
- **Client Balance Tracking**: Automatic tracking of total purchases, payments, and outstanding balances
- **Payment History**: Complete history of all payments made by each client

### 2. Partial Payment Support
- **Pay Some Now**: Allow customers to pay a portion of the total amount
- **Automatic Balance Calculation**: System automatically calculates and tracks remaining balance
- **Multiple Payments**: Clients can make multiple payments until the balance is cleared

### 3. Pay Later (Credit System)
- **Full Credit**: Allow trusted clients to purchase without immediate payment
- **Debt Tracking**: All unpaid amounts are tracked against the client's account
- **Payment Reminders**: View all clients with outstanding balances

## How to Use

### Adding a New Client
1. Click the "العملاء (Clients)" button with the "+" icon in the main menu
2. Fill in the client information:
   - Name (required)
   - Phone (optional)
   - Email (optional)
   - Address (optional)
3. Click "حفظ العميل (Save Client)"

### Making a Sale with Partial Payment
1. Add products to cart as usual
2. Select the client from the dropdown at the top of the cart
3. Click "دفع (Pay)" button
4. Check the "دفع جزئي (Partial Payment)" checkbox
5. Enter the amount the client is paying now
6. Click "تأكيد الدفع (Confirm Payment)"
7. The remaining balance is automatically added to the client's account

### Making a Sale with Pay Later
1. Add products to cart as usual
2. Select the client from the dropdown at the top of the cart
3. Click "دفع (Pay)" button
4. Check the "دفع لاحق (Pay Later)" checkbox
5. Click "تأكيد الدفع (Confirm Payment)"
6. The full amount is added to the client's outstanding balance

### Managing Client Payments
1. Click "العملاء (Clients)" button to view all clients
2. Find the client with an outstanding balance
3. Click "دفع (Pay)" button next to their name
4. Enter the payment amount
5. Select payment type (Cash/Card)
6. Add optional note
7. Click "تأكيد الدفع (Confirm Payment)"

### Viewing Client Details
1. Click "العملاء (Clients)" button
2. Click the eye icon next to any client
3. View:
   - Contact information
   - Outstanding balance
   - Total purchases
   - Total paid
   - Payment history

## Technical Details

### New API Endpoints

#### Clients API (`/api/clients`)
- `GET /all` - Get all clients
- `GET /client/:clientId` - Get specific client
- `POST /client` - Create new client
- `PUT /client` - Update client
- `DELETE /client/:clientId` - Delete client
- `POST /client/:clientId/payment` - Add payment to client account
- `POST /client/:clientId/purchase` - Add purchase/debt to client account
- `GET /clients/with-balance` - Get clients with outstanding balances

#### Updated Transaction API
- `POST /add-payment/:transactionId` - Add payment to existing transaction
- `GET /unpaid/all` - Get all unpaid/partially paid transactions
- `GET /client/:clientId/transactions` - Get all transactions for a client

### Database Schema

#### Client Document
```javascript
{
    _id: string,
    name: string,
    phone: string,
    email: string,
    address: string,
    balance: number,  // Outstanding balance
    totalPurchases: number,  // Total amount of all purchases
    totalPaid: number,  // Total amount paid
    createdAt: Date,
    updatedAt: Date,
    paymentHistory: [{
        amount: number,
        date: Date,
        transactionId: string,
        paymentType: string,
        note: string
    }]
}
```

#### Updated Transaction Document
```javascript
{
    // ... existing fields ...
    client: {
        _id: string,
        name: string
    },
    paymentHistory: [{
        amount: number,
        date: Date,
        paymentType: number,
        paymentInfo: string
    }],
    isPartialPayment: boolean,
    isPayLater: boolean
}
```

## Files Modified/Created

### New Files
- `api/clients.js` - Client management API
- `assets/js/clients.js` - Client management frontend logic
- `CLIENT-FEATURES-README.md` - This documentation

### Modified Files
- `server.js` - Added clients API route
- `api/transactions.js` - Added payment history and additional payment support
- `index.html` - Added client selection UI, payment options, and modals
- `assets/js/pos.js` - Integrated client features into transaction flow

## User Interface Changes

### Main POS View
- New client selector dropdown above the barcode scanner
- "+" button to quickly add new clients

### Payment Modal
- New "دفع جزئي (Partial Payment)" checkbox
- New "دفع لاحق (Pay Later)" checkbox
- "الرصيد المتبقي (Remaining Balance)" display for partial payments

### New Modals
- **New Client Modal**: Add client information
- **Clients List Modal**: View and manage all clients
- **Client Payment Modal**: Add payments to client accounts

### Main Menu
- New "العملاء (Clients)" button with dropdown for quick access

## Receipts

Receipts now show:
- Client name (if selected)
- Partial payment information
- Remaining balance (for partial payments)
- "Pay Later" notation (for credit transactions)

## Important Notes

1. **Client Selection Required**: Partial payments and pay later options only work when a client is selected (not "عميل عابر")

2. **Inventory Management**: 
   - Inventory is only decremented when payment is FULLY received
   - For partial payments, inventory is decremented when the final payment completes the transaction
   - For pay later, inventory is decremented when the debt is fully paid

3. **Transaction Status**:
   - Status = 0: Unpaid or partially paid
   - Status = 1: Fully paid

4. **Multiple Payments**: The system supports adding multiple payments to a single transaction through the API endpoint `/add-payment/:transactionId`

## Future Enhancements

Potential future features to consider:
- SMS/Email notifications for outstanding balances
- Payment reminders based on due dates
- Credit limits for clients
- Detailed transaction history per client
- Export client statements
- Aging reports for outstanding balances
- Integration with accounting systems

## Support

For issues or questions, please refer to the main application documentation or contact the development team.

---

**Version**: 1.0  
**Last Updated**: November 2025


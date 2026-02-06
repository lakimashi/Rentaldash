# Customer Support Bot Implementation Plan

## Overview
Step-by-step implementation guide for creating a customer support bot using n8n that integrates with the Rental Dashboard API. This plan includes exact HTTP request configurations for all essential functions.

## Prerequisites

1. **API Key Setup**
   - Generate API key: `POST /api/integrations/api-keys`
   - Store in n8n credentials
   - Use in all requests: `Authorization: Bearer <your-key>`

2. **n8n Setup**
   - Install required nodes: HTTP Request, AI (OpenAI), Function, Switch, Webhook
   - Create credentials for Rental API

## Implementation Plan

### 1. Core Bot Workflow Structure

```
Webhook Trigger → AI Intent Recognition → Route by Intent → Specific API Calls → Format Response → Customer
```

### 2. Essential HTTP Request Configurations

#### A. Check Car Availability
**Purpose**: Find available cars for date range
**HTTP Request Node Configuration**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/availability",
  "qs": {
    "start": "{{ $json.startDate }}",
    "end": "{{ $json.endDate }}",
    "class": "{{ $json.carClass || '' }}",
    "branch_id": "{{ $json.branchId || '' }}"
  },
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

**Example Response Handling**:
```javascript
// Function node after availability check
const cars = items[0].json;

if (cars.length === 0) {
  return [{
    json: {
      response: "Sorry, no cars available for those dates. Try different dates?",
      availableCars: []
    }
  }];
}

const formatted = cars.map((car, i) => 
  `${i+1}. ${car.make} ${car.model} (${car.class})\n` +
  `   Rate: $${car.base_daily_rate}/day\n` +
  `   Branch: ${car.branch_name}\n` +
  `   Plate: ${car.plate_number}`
).join('\n\n');

return [{
  json: {
    response: `Available cars:\n\n${formatted}\n\nReply with car number to book`,
    availableCars: cars,
    dates: { start: $json.startDate, end: $json.endDate }
  }
}];
```

#### B. Create New Booking
**Purpose**: Create a reservation
**HTTP Request Node Configuration**:
```json
{
  "method": "POST",
  "url": "http://localhost:3001/api/bookings",
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}",
    "Content-Type": "application/json"
  },
  "body": {
    "car_id": {{ $json.carId }},
    "customer_name": "{{ $json.customerName }}",
    "customer_phone": "{{ $json.customerPhone || null }}",
    "customer_email": "{{ $json.customerEmail || null }}",
    "start_date": "{{ $json.startDate }}",
    "end_date": "{{ $json.endDate }}",
    "status": "draft",
    "notes": "{{ $json.notes || 'Created by bot' }}",
    "total_price": {{ $json.totalPrice }},
    "deposit": {{ $json.deposit || 0 }}
  }
}
```

#### C. Update Booking Status
**Purpose**: Confirm or cancel a booking
**HTTP Request Node Configuration**:
```json
{
  "method": "PUT",
  "url": "http://localhost:3001/api/bookings/{{ $json.bookingId }}/status",
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "{{ $json.status }}" // "reserved" or "cancelled"
  }
}
```

#### D. Search Customers
**Purpose**: Find existing customer
**HTTP Request Node Configuration**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/customers",
  "qs": {
    "search": "{{ $json.searchTerm }}"
  },
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

#### E. Get Customer Details
**Purpose**: Retrieve customer with booking history
**HTTP Request Node Configuration**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/customers/{{ $json.customerId }}",
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

#### F. Get Booking Details
**Purpose**: Check booking status
**HTTP Request Node Configuration**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/bookings/{{ $json.bookingId }}",
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

#### G. List All Cars
**Purpose**: Browse fleet without specific dates
**HTTP Request Node Configuration**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/cars",
  "qs": {
    "status": "active",
    "class": "{{ $json.carClass || '' }}",
    "branch_id": "{{ $json.branchId || '' }}"
  },
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

### 3. Complete Workflow Implementations

#### Workflow 1: Full Booking Process

**Nodes Setup**:

1. **Webhook** (Trigger)
   - Path: `/booking-bot`
   - Response: `{ "message": "Processing..." }`

2. **AI Intent Recognition**
   ```javascript
   // AI/LLM Node Prompt
   Extract the following from customer message:
   - Intent: one of [check_availability, book_car, modify_booking, cancel_booking, check_status, browse_cars, help]
   - Start date (YYYY-MM-DD format)
   - End date (YYYY-MM-DD format)
   - Car class (if mentioned)
   - Branch (if mentioned)
   - Customer name
   - Customer phone
   - Customer email
   
   Message: {{ $json.message }}
   
   Return JSON format:
   {
     "intent": "...",
     "startDate": "...",
     "endDate": "...",
     "carClass": "...",
     "branch": "...",
     "customerName": "...",
     "customerPhone": "...",
     "customerEmail": "..."
   }
   ```

3. **Switch Node** (Route by Intent)
   - Routes: check_availability, book_car, modify_booking, cancel_booking, check_status, browse_cars, help

4. **Check Availability Sub-flow**:
   - Input validation node
   - HTTP Request to /api/availability
   - Format response node
   - Store context in n8n memory

5. **Book Car Sub-flow**:
   - Get context from previous step
   - Extract car selection
   - Validate customer info
   - Calculate price
   - Create booking (draft)
   - Send confirmation
   - On confirmation: Update status to "reserved"

#### Workflow 2: Price Calculator

**Purpose**: Calculate total price including extras
**Function Node**:
```javascript
const car = $json.car;
const days = $json.days;
const extras = $json.extras || [];

const dailyRate = car.base_daily_rate;
const basePrice = days * dailyRate;
const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
const subtotal = basePrice + extrasTotal;
const tax = subtotal * 0.1; // 10% tax
const total = subtotal + tax;

return [{
  json: {
    pricing: {
      dailyRate,
      days,
      basePrice,
      extras: extrasTotal,
      subtotal,
      tax,
      total
    },
    summary: `Base: $${basePrice} (${days} days × $${dailyRate})
Extras: $${extrasTotal}
Subtotal: $${subtotal}
Tax (10%): $${tax}
Total: $${total}`
  }
}];
```

#### Workflow 3: Booking Confirmation

**Purpose**: Send confirmation and handle responses
**HTTP Request (Email/SMS)**:
```json
{
  "method": "POST",
  "url": "{{ $webhookUrl }}/send-confirmation",
  "body": {
    "to": "{{ $json.customerPhone }}",
    "message": "Your booking #{{ $json.bookingId }} is confirmed!\n\nDetails:\nCar: {{ $json.carMake }} {{ $json.carModel }}\nDates: {{ $json.startDate }} to {{ $json.endDate }}\nTotal: ${{ $json.totalPrice }}\n\nReply 'STATUS {{ $json.bookingId }}' to check status"
  }
}
```

### 4. Error Handling Configurations

#### Standard Error Handler Node
```javascript
// Function node after each API call
const response = $json;
const error = $node["HTTP Request"].json.error;

if (error) {
  const statusCode = error.statusCode || 500;
  
  const errorMessages = {
    400: "Invalid information provided. Please check and try again.",
    401: "Authentication failed. Please contact support.",
    403: "Permission denied. This action is not allowed.",
    404: "Not found. Please check your reference.",
    409: "Conflict. This car is no longer available for selected dates.",
    422: "Validation error. Please check all required fields.",
    500: "Server error. Please try again later."
  };
  
  return [{
    json: {
      error: true,
      message: errorMessages[statusCode] || "Something went wrong.",
      details: error.message
    }
  }];
}

return [{ json: response }];
```

### 5. Advanced Features Implementation

#### Feature 1: Car Recommendations
**Function Node**:
```javascript
const customerHistory = $json.customerHistory;
const availableCars = $json.availableCars;
const previousBookings = $json.previousBookings;

// Extract customer preferences
const preferences = {
  classes: [...new Set(previousBookings.map(b => b.car.class))],
  makes: [...new Set(previousBookings.map(b => b.car.make))],
  avgDailyRate: previousBookings.reduce((sum, b) => sum + b.dailyRate, 0) / previousBookings.length
};

// Score available cars
const scoredCars = availableCars.map(car => {
  let score = 0;
  
  // Preferred class
  if (preferences.classes.includes(car.class)) score += 2;
  
  // Preferred make
  if (preferences.makes.includes(car.make)) score += 2;
  
  // Similar price range
  if (Math.abs(car.base_daily_rate - preferences.avgDailyRate) < 20) score += 1;
  
  return { ...car, score };
});

// Sort by score and return top 3
const recommendations = scoredCars
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);

return [{
  json: {
    recommendations,
    message: `Based on your previous rentals, you might like:\n\n` +
      recommendations.map((car, i) => 
        `${i+1}. ${car.make} ${car.model} - $${car.base_daily_rate}/day`
      ).join('\n')
  }
}];
```

#### Feature 2: Cancellation Policy Check
**HTTP Request Node**:
```json
{
  "method": "GET",
  "url": "http://localhost:3001/api/settings",
  "headers": {
    "Authorization": "Bearer {{ $credentials.rentalApi.apiKey }}"
  }
}
```

**Function Node**:
```javascript
const settings = items[0].json;
const booking = $json.booking;
const today = new Date();
const startDate = new Date(booking.start_date);
const daysUntilRental = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

const cancellationPolicy = {
  fullRefund: daysUntilRental >= settings.cancellation_full_refund_days || 7,
  partialRefund: daysUntilRental >= settings.cancellation_partial_refund_days || 3,
  noRefund: daysUntilRental < 3
};

let refundAmount = 0;
let message = "";

if (cancellationPolicy.fullRefund) {
  refundAmount = booking.total_price;
  message = "Full refund available";
} else if (cancellationPolicy.partialRefund) {
  refundAmount = booking.total_price * 0.5; // 50% refund
  message = "50% refund available";
} else {
  refundAmount = 0;
  message = "No refund available (less than 3 days before rental)";
}

return [{
  json: {
    canCancel: true,
    refundAmount,
    message,
    policyMessage: `${message}. Cancellation fee: $${booking.total_price - refundAmount}`
  }
}];
```

### 6. Testing Your Bot

#### Test Cases:
1. **Availability Check**:
   - Message: "Check cars for Feb 10-15, want a sedan"
   - Expected: List of available sedans

2. **Book Car**:
   - Message: "I'll take option 2, my name is John Doe, phone 555-0123"
   - Expected: Confirmation with booking ID

3. **Check Status**:
   - Message: "Check status of booking 12345"
   - Expected: Current booking status

4. **Cancel Booking**:
   - Message: "Cancel booking 12345"
   - Expected: Cancellation confirmation with refund info

### 7. Deployment Steps

1. **Set up n8n Workflow**:
   - Import workflow JSON
   - Configure API credentials
   - Test each node individually

2. **Connect to Channels**:
   - Webhook endpoint for website chat
   - WhatsApp Business API integration
   - SMS gateway (optional)

3. **Monitoring**:
   - Set up error notifications
   - Log all interactions
   - Monitor API usage

4. **Go Live**:
   - Enable webhook
   - Monitor first 50 interactions
   - Collect feedback
   - Iterate and improve

### 8. Best Practices

1. **Always Validate**:
   - Date formats
   - Phone numbers
   - Email addresses
   - Required fields

2. **Context Management**:
   - Store conversation state
   - Remember previous selections
   - Timeout inactive conversations

3. **User Experience**:
   - Clear, concise responses
   - Progress indicators
   - Confirmations before actions
   - Easy cancellation

4. **Performance**:
   - Cache frequent requests
   - Use async operations
   - Implement rate limiting
   - Monitor response times

## Summary

This implementation plan provides:
- Complete HTTP request configurations for all essential functions
- Step-by-step workflow setups
- Error handling strategies
- Advanced feature implementations
- Testing procedures
- Deployment guidelines

Follow these configurations to build a fully functional customer support bot that can handle bookings, check availability, manage customers, and provide excellent service 24/7.
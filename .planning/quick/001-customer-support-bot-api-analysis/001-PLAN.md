# Customer Support Bot API Analysis

## Overview
This document analyzes the Rental Dashboard backend APIs for implementing a customer support bot that can help with bookings, reservations, and finding available cars. The analysis includes n8n integration recommendations.

## Key APIs for Customer Support Bot

### 1. Authentication
- **Method**: API Key Authentication (for bot integration)
- **Endpoint**: Not required - use headers
- **How**: Include API key in `Authorization: Bearer <key>` or `X-API-Key: <key>`
- **Note**: API keys give staff-level permissions (can create bookings, but can't manage users/settings)

### 2. Check Car Availability
**Endpoint**: `GET /api/availability`
- **Purpose**: Find available cars for specific dates
- **Query Params**:
  - `start` (required): Start date (YYYY-MM-DD)
  - `end` (required): End date (YYYY-MM-DD)
  - `class` (optional): Car class (e.g., "Sedan", "SUV")
  - `branch_id` (optional): Filter by branch location
- **Response**: Array of available cars with details
- **Example**:
  ```
  GET /api/availability?start=2026-02-10&end=2026-02-15&class=Sedan
  ```

### 3. List All Cars
**Endpoint**: `GET /api/cars`
- **Purpose**: Browse all cars with filters
- **Query Params**:
  - `status`: Filter by status ("active", "maintenance", "inactive")
  - `class`: Filter by car class
  - `branch_id`: Filter by branch
- **Response**: Array of cars with images, pricing, branch info
- **Use Case**: Help customers browse fleet without specific dates

### 4. Create Booking/Reservation
**Endpoint**: `POST /api/bookings`
- **Purpose**: Create a new booking or reservation
- **Required Fields**:
  - `car_id`: ID of the car to book
  - `customer_name`: Customer's full name
  - `start_date`: Pickup date (YYYY-MM-DD)
  - `end_date`: Return date (YYYY-MM-DD)
- **Optional Fields**:
  - `customer_phone`: Contact phone
  - `customer_id_passport`: ID number
  - `customer_id`: Link to existing customer
  - `status`: Booking status (default: "draft")
  - `total_price`: Calculated or manual price
  - `deposit`: Deposit amount
  - `notes`: Special requests
- **Validation**: Automatically checks for date conflicts
- **Response**: Created booking with ID

### 5. Search Customers
**Endpoint**: `GET /api/customers`
- **Purpose**: Find existing customers
- **Query Params**:
  - `search`: Search across name, email, phone, ID number
- **Use Case**: Retrieve customer history for returning customers

### 6. Get Customer Details
**Endpoint**: `GET /api/customers/:id`
- **Purpose**: Get customer details with booking history
- **Response**: Customer info + all past/active bookings
- **Use Case**: Reference previous rentals, preferences

### 7. Check Specific Booking
**Endpoint**: `GET /api/bookings/:id`
- **Purpose**: Get booking details
- **Response**: Full booking info with car details
- **Use Case**: Check booking status, modify if needed

### 8. Update Booking Status
**Endpoint**: `PUT /api/bookings/:id/status`
- **Purpose**: Change booking status
- **Body**: `{ "status": "confirmed" | "cancelled" }`
- **Use Case**: Confirm reservation, handle cancellations

## N8n Integration Strategy

### 1. Authentication Setup
1. Create an API key via `POST /api/integrations/api-keys`
2. Store the key securely in n8n credentials
3. Use n8n's HTTP Request nodes with Bearer token authentication

### 2. Recommended N8n Workflow Structure

#### Customer Chat Flow:
```
Customer Message → N8n Webhook → 
├─ Intent Recognition (AI node) →
│  ├─ Check Availability → /api/availability
│  ├─ Browse Cars → /api/cars
│  ├─ Create Booking → /api/bookings
│  └─ Check Status → /api/bookings/:id
└─ Response Formatting → Customer
```

#### Key N8n Nodes Configuration:

1. **HTTP Request Node - Check Availability**:
   - Method: GET
   - URL: `{{ $baseUrl }}/api/availability`
   - Query Parameters:
     - start: `{{ $json.startDate }}`
     - end: `{{ $json.endDate }}`
     - class: `{{ $json.carClass }}`
   - Authentication: Bearer Token

2. **HTTP Request Node - Create Booking**:
   - Method: POST
   - URL: `{{ $baseUrl }}/api/bookings`
   - Body: JSON
   ```json
   {
     "car_id": {{ $json.carId }},
     "customer_name": "{{ $json.customerName }}",
     "customer_phone": "{{ $json.phone }}",
     "start_date": "{{ $json.startDate }}",
     "end_date": "{{ $json.endDate }}",
     "status": "reserved",
     "notes": "{{ $json.notes }}"
   }
   ```

3. **Function Node - Process Available Cars**:
   ```javascript
   // Format car options for customer
   const cars = items[0].json;
   const options = cars.map((car, index) => 
     `${index + 1}. ${car.make} ${car.model} (${car.class}) - $${car.base_daily_rate}/day\n` +
     `   Plate: ${car.plate_number}, Branch: ${car.branch_name}\n` +
     `   Available: ${new Date(car.start_date).toLocaleDateString()} to ${new Date(car.end_date).toLocaleDateString()}`
   ).join('\n\n');
   
   return [{
     json: {
       message: `Here are the available cars:\n\n${options}`,
       carData: cars
     }
   }];
   ```

### 3. Example Bot Conversation Flow

#### Scenario 1: Check Availability
```
Customer: "I need a car from Feb 10-15, preferably a sedan"
Bot: 
1. Parse dates and preferences
2. Call: GET /api/availability?start=2026-02-10&end=2026-02-15&class=Sedan
3. Format response with available options
```

#### Scenario 2: Make Reservation
```
Customer: "I'll take option 2"
Bot:
1. Get selected car ID from previous response
2. Collect customer details (name, phone)
3. Call: POST /api/bookings with all details
4. Confirm booking with reference number
```

### 4. Error Handling in N8n

Always include error handling nodes:
- Check for HTTP status codes
- Handle conflicts (car already booked)
- Validate date ranges
- Format user-friendly error messages

### 5. Advanced Features

#### Price Calculation:
- Call availability endpoint to get car rates
- Calculate total: (days * daily_rate) + extras
- Add tax/discounts as needed

#### Booking Confirmation Flow:
1. Create booking with status "draft"
2. Calculate and send price
3. On confirmation: update status to "reserved"
4. Send confirmation with booking ID

#### Vehicle Recommendations:
- Use customer history to suggest similar cars
- Consider upgrade options based on availability
- Package deals with extras

## Security Considerations

1. **API Key Management**:
   - Rotate keys regularly
   - Monitor usage via audit logs
   - Restrict to staff permissions

2. **Data Validation**:
   - Always validate dates (start < end)
   - Sanitize customer inputs
   - Verify car availability before booking

3. **Rate Limiting**:
   - Implement at n8n or API gateway level
   - Prevent abuse/spam

## Example Implementation Code

### Simple Bot Script (Node.js):
```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const API_KEY = 'your-api-key-here';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

async function checkAvailability(startDate, endDate, carClass) {
  try {
    const response = await api.get('/availability', {
      params: { start: startDate, end: endDate, class: carClass }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error.response?.data || error.message);
    throw error;
  }
}

async function createBooking(bookingData) {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw error;
  }
}

// Usage example
(async () => {
  const available = await checkAvailability('2026-02-10', '2026-02-15', 'Sedan');
  console.log('Available cars:', available);
  
  if (available.length > 0) {
    const booking = await createBooking({
      car_id: available[0].id,
      customer_name: 'John Doe',
      customer_phone: '+1234567890',
      start_date: '2026-02-10',
      end_date: '2026-02-15'
    });
    console.log('Booking created:', booking);
  }
})();
```

## Summary

The rental dashboard provides a comprehensive API set for customer support automation:

1. **Availability checking** with real-time conflict detection
2. **Booking creation** with automatic validation
3. **Customer management** for returning customers
4. **API key authentication** perfect for bot integration
5. **Clear data structures** easy to work with in n8n

The APIs are designed to be bot-friendly with:
- Clear error messages
- Automatic conflict prevention
- Flexible search options
- Staff-level permissions for API keys

This makes it straightforward to build a customer support bot that can handle common inquiries and bookings autonomously through n8n workflows.
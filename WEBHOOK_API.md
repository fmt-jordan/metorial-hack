# Webhook API Documentation

## Overview

This API receives webhook events from Voice Assistant calls and creates mold inspection quotes in the system. When a webhook is received, it automatically stores the customer information and quote details in the database and triggers a real-time notification to display the quote email.

## Endpoint

```
POST /api/webhook
```

## Authentication

No authentication required. The endpoint accepts anonymous requests.

## Request Format

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "Name / Company": "string (required)",
  "FMT Location": "string (optional)",
  "Client Address": "string (optional)",
  "Email": "string (required)",
  "Phone": "string (required)",
  "Client Notes": "string (optional)",
  "Items": [
    {
      "Item": "string (required)",
      "Item Price": number (required),
      "Qty": number (required)
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name / Company` | string | Yes | Customer name or company name |
| `FMT Location` | string | No | Fast Mold Testing service location/city (e.g., "Miami", "New York") |
| `Client Address` | string | No | Full service address for the mold inspection |
| `Email` | string | Yes | Customer email address |
| `Phone` | string | Yes | Customer phone number |
| `Client Notes` | string | No | Brief summary of customer's problem or request |
| `Items` | array | No | Array of service line items for the quote |
| `Items[].Item` | string | Yes | Service name (e.g., "First Room", "Add Small Room") |
| `Items[].Item Price` | number | Yes | Unit price for the service in USD |
| `Items[].Qty` | number | Yes | Quantity of service ordered |

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "id": "uuid"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates successful webhook processing |
| `id` | string | UUID of the created webhook event in the database |

### Error Responses

#### 400 Bad Request - Missing Required Fields

```json
{
  "error": "Missing required fields"
}
```

Returned when `Name / Company`, `Email`, or `Phone` is not provided.

#### 500 Internal Server Error

```json
{
  "error": "Failed to save webhook event"
}
```

Returned when the database operation fails.

```json
{
  "error": "Internal server error"
}
```

Returned for unexpected server errors.

## Example Requests

### Basic Quote Example

```bash
curl -X POST https://your-domain.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Name / Company": "John Smith",
    "FMT Location": "Miami",
    "Client Address": "123 Ocean Drive, Miami Beach, FL 33139",
    "Email": "john.smith@email.com",
    "Phone": "(305) 555-1234",
    "Client Notes": "Customer reported visible mold in bathroom and musty smell in basement.",
    "Items": [
      {
        "Item": "First Room",
        "Item Price": 299,
        "Qty": 1
      },
      {
        "Item": "Add Small Room",
        "Item Price": 99,
        "Qty": 2
      }
    ]
  }'
```

### Commercial Property Example

```bash
curl -X POST https://your-domain.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Name / Company": "Sunset Real Estate Corp",
    "FMT Location": "New York",
    "Client Address": "456 Park Avenue, New York, NY 10022",
    "Email": "facilities@sunsetrealestate.com",
    "Phone": "(212) 555-9876",
    "Client Notes": "Commercial building with water damage on 3rd floor.",
    "Items": [
      {
        "Item": "First Room",
        "Item Price": 299,
        "Qty": 1
      },
      {
        "Item": "Add Large Room",
        "Item Price": 149,
        "Qty": 3
      },
      {
        "Item": "Commercial Space Premium",
        "Item Price": 499,
        "Qty": 1
      }
    ]
  }'
```

### Minimal Request Example

```bash
curl -X POST https://futuristic-voice-age-z8k5.bolt.host/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Name / Company": "Maria Garcia",
    "Email": "maria@email.com",
    "Phone": "(310) 555-4567"
  }'
```

## Behavior

### Database Operations

1. Creates a new record in the `webhook_events` table with customer information
2. If `Items` array is provided, creates records in the `quote_line_items` table
3. Sets `viewed` flag to `false` by default
4. Automatically timestamps the creation with `created_at`

### Real-time Notifications

When a webhook is successfully processed:

1. A Supabase Realtime event is triggered
2. Connected clients receive the new webhook event
3. The quote email modal automatically displays with the customer information
4. The webhook console shows a notification of the received webhook

### Data Persistence

All webhook data is permanently stored in the database and can be:

- Viewed in the Quote History modal
- Queried through the Supabase database
- Used for analytics and reporting
- Exported for external systems

## Service Line Items

### Common Service Types

| Service | Typical Price | Description |
|---------|--------------|-------------|
| First Room | $299 | Initial room inspection |
| Add Small Room | $99 | Additional small room (bedroom, bathroom) |
| Add Large Room | $149 | Additional large room (living room, kitchen) |
| Attic/Crawl Space | $199 | Attic or crawl space inspection |
| Commercial Space Premium | $499 | Commercial property premium service |

These are example services. The API accepts any service name and price as specified in the webhook payload.

## Integration Notes

### Voice Assistant Setup

Configure your Voice Assistant to send webhook events to this endpoint when:

- A call completes successfully
- Customer provides all required information
- Quote calculation is finalized

### Error Handling

Implement retry logic in your Voice Assistant for:

- Network timeouts (retry after 5 seconds)
- 500 errors (retry up to 3 times with exponential backoff)
- 400 errors (do not retry, fix the payload)

### Testing

Use the built-in Test Webhooks modal in the application to:

- Send sample webhook payloads
- Verify database operations
- Test real-time notification system
- Preview quote email rendering

## Security Considerations

### Current Implementation

- No authentication required (suitable for internal networks)
- No rate limiting implemented
- All data stored permanently in database

### Production Recommendations

1. **Add Authentication**: Implement API key or JWT validation
2. **Rate Limiting**: Prevent abuse with request throttling
3. **Input Validation**: Sanitize and validate all input fields
4. **HTTPS Only**: Ensure endpoint is only accessible via HTTPS
5. **Webhook Signatures**: Verify webhook authenticity with signatures
6. **IP Allowlisting**: Restrict access to known Voice Assistant IPs

## Troubleshooting

### Webhook Not Received

1. Verify the endpoint URL is correct
2. Check that the Voice Assistant can reach the endpoint
3. Ensure the request includes `Content-Type: application/json` header
4. Validate the JSON payload structure

### Quote Not Displaying

1. Check browser console for JavaScript errors
2. Verify Supabase Realtime is connected
3. Ensure the database migration was applied successfully
4. Check that Realtime is enabled for the `webhook_events` table

### Line Items Not Appearing

1. Verify `Items` array is properly formatted in the webhook payload
2. Check database for `quote_line_items` records
3. Ensure foreign key relationship is intact

## Support

For issues or questions:

1. Check the webhook console in the application for error messages
2. Review database logs in Supabase dashboard
3. Test with the built-in Test Webhooks feature
4. Verify network connectivity between Voice Assistant and API endpoint

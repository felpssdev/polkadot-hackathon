# PIX Integration Guide

## Current Status

**MOCK MODE ACTIVE**: The PIX payment service is currently using a mock implementation for development and testing.

- Provider: `MockProvider`
- Transactions: Stored in memory (lost on server restart)
- QR Codes: Simplified format (not real EMV)
- Payment Verification: Simulated

## Architecture

The PIX service uses a provider pattern to support multiple implementations:

```
PIXService (main service)
├── MockProvider (current - for development)
└── StarkBankProvider (future - for production)
```

## Switching to Real Provider (Stark Bank)

### Prerequisites

1. **Stark Bank Account**
   - Create account at https://starkbank.com
   - Complete business verification
   - Create a project

2. **Credentials**
   - Project ID
   - Private Key (EC format)
   - Environment: `sandbox` or `production`

### Configuration Steps

#### 1. Install Stark Bank SDK

```bash
cd backend
source venv/bin/activate
pip install starkbank
```

#### 2. Configure Environment Variables

**Option A: Using .env file**

```env
# Disable mock
PIX_MOCK_ENABLED=False

# Select provider
PIX_PROVIDER=starkbank

# Stark Bank credentials
STARKBANK_ENVIRONMENT=sandbox  # or production
STARKBANK_PROJECT_ID=your-project-id
STARKBANK_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----
...
-----END EC PRIVATE KEY-----
```

**Option B: Using Docker Compose**

Update `docker-compose.yml`:

```yaml
environment:
  - PIX_MOCK_ENABLED=False
  - PIX_PROVIDER=starkbank
  - STARKBANK_ENVIRONMENT=sandbox
  - STARKBANK_PROJECT_ID=${STARKBANK_PROJECT_ID}
  - STARKBANK_PRIVATE_KEY=${STARKBANK_PRIVATE_KEY}
```

#### 3. Implement Stark Bank Provider

The skeleton is ready at `backend/app/services/pix/providers/starkbank_provider.py`.

**Steps:**

1. Uncomment Stark Bank imports
2. Implement `generate_pix_qr_code()` method
3. Implement `verify_payment()` method
4. Test in sandbox environment
5. Deploy to production

**Example Implementation:**

```python
# In starkbank_provider.py

import starkbank
from starkbank import Invoice

def generate_pix_qr_code(self, pix_key: str, amount: float, ...):
    invoice = Invoice.create([Invoice(
        amount=int(amount * 100),  # Convert to centavos
        tax_id=pix_key,  # CPF/CNPJ
        name=recipient_name,
        # ... other fields
    )])
    
    return {
        "txid": invoice.id,
        "qr_code": invoice.qr_code,
        "qr_code_image": invoice.qr_code_image,
        "pix_key": pix_key,
        "amount": amount
    }
```

#### 4. Set Up Webhook (Recommended)

Stark Bank can send webhooks when payments are confirmed.

**Create webhook endpoint:**

```python
# backend/app/api/webhooks.py

@router.post("/webhooks/pix")
async def pix_webhook(request: Request):
    # Verify webhook signature
    # Update order status automatically
    # Notify user/LP
```

**Configure in Stark Bank dashboard:**
- Webhook URL: `https://your-domain.com/api/v1/webhooks/pix`
- Events: `invoice.paid`, `invoice.canceled`

### Testing

1. **Sandbox Testing**
   - Use `STARKBANK_ENVIRONMENT=sandbox`
   - Test QR code generation
   - Test payment verification
   - Test webhook handling

2. **Production Migration**
   - Switch to `STARKBANK_ENVIRONMENT=production`
   - Update credentials
   - Monitor logs
   - Test with small amounts first

## Provider Selection Logic

The service selects providers in this order:

1. **PIX_MOCK_ENABLED=True** → Always use MockProvider (backward compatibility)
2. **PIX_PROVIDER=mock** → Use MockProvider
3. **PIX_PROVIDER=starkbank** → Use StarkBankProvider (if credentials available)
4. **Fallback** → MockProvider if provider unavailable

## Current Mock Implementation

### MockProvider Features

- Generates fake transaction IDs
- Creates QR codes with simplified payload
- Stores transactions in memory
- Allows manual payment confirmation for testing

### Limitations

- Transactions lost on server restart
- No real bank integration
- Simplified QR code format (not EMV compliant)
- No webhook support

## Migration Checklist

- [ ] Create Stark Bank account
- [ ] Complete business verification
- [ ] Create project and get credentials
- [ ] Install Stark Bank SDK
- [ ] Configure environment variables
- [ ] Implement StarkBankProvider methods
- [ ] Test in sandbox
- [ ] Set up webhook endpoint
- [ ] Configure webhook in Stark Bank dashboard
- [ ] Test webhook handling
- [ ] Switch to production environment
- [ ] Update production credentials
- [ ] Monitor logs and transactions
- [ ] Update documentation

## Troubleshooting

### Provider Not Switching

**Problem**: Service still using mock after configuration

**Solutions**:
1. Check `PIX_MOCK_ENABLED` is `False`
2. Verify `PIX_PROVIDER` is set correctly
3. Check credentials are valid
4. Review logs for initialization errors

### Credentials Not Found

**Problem**: "Stark Bank credentials not configured"

**Solutions**:
1. Verify environment variables are set
2. Check `.env` file exists and is loaded
3. For Docker: Check `docker-compose.yml` environment section
4. Restart service after configuration

### Provider Initialization Fails

**Problem**: Provider fails to initialize

**Solutions**:
1. Check SDK is installed: `pip list | grep starkbank`
2. Verify private key format (EC format required)
3. Check project ID is correct
4. Review error logs for details

## Code Structure

```
backend/app/services/pix/
├── __init__.py
├── providers/
│   ├── __init__.py
│   ├── base.py              # Abstract base class
│   ├── mock_provider.py     # Mock implementation (current)
│   └── starkbank_provider.py # Stark Bank skeleton (future)
└── pix_service.py           # Main service (uses providers)
```

## Additional Resources

- [Stark Bank Documentation](https://starkbank.com/docs)
- [PIX EMV QR Code Format](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf)
- [Banco Central PIX Regulations](https://www.bcb.gov.br/estabilidadefinanceira/pix)

## Support

For issues or questions:
- Check service logs: `docker-compose logs backend`
- Review provider initialization messages
- Verify configuration matches documentation


"""
PIX Service

Service for PIX payment integration with support for multiple providers.

Current Status:
- MOCK: Using MockProvider for development/testing
- Real providers (Stark Bank) are ready for implementation

To switch providers:
1. Set PIX_PROVIDER environment variable (mock, starkbank)
2. Configure provider-specific credentials
3. Service automatically selects and initializes provider

For migration guide, see: docs/pix-integration.md
"""
from typing import Dict, Any, Optional
import logging

from app.config import settings
from app.services.pix.providers import MockProvider, BasePIXProvider

# StarkBankProvider is optional (skeleton only)
try:
    from app.services.pix.providers import StarkBankProvider
except ImportError:
    StarkBankProvider = None

logger = logging.getLogger(__name__)


class PIXService:
    """
    PIX payment service with provider abstraction.
    
    This service delegates to provider implementations:
    - MockProvider: For development/testing (current)
    - StarkBankProvider: For production (skeleton ready)
    
    Provider selection:
    1. Check PIX_MOCK_ENABLED (backward compatibility)
    2. Check PIX_PROVIDER environment variable
    3. Fallback to mock if provider unavailable
    
    Current mode: MOCK (PIX_MOCK_ENABLED=True)
    """
    
    def __init__(self):
        """Initialize PIX service with appropriate provider"""
        self.provider: BasePIXProvider = self._initialize_provider()
        self.logger = logging.getLogger(__name__)
        
        # Log current provider status
        provider_name = self.provider.__class__.__name__
        if isinstance(self.provider, MockProvider):
            self.logger.warning(
                "PIX service is using MOCK mode - transactions are simulated. "
                "For production, configure a real provider (e.g., Stark Bank)."
            )
        else:
            self.logger.info(f"PIX service initialized with provider: {provider_name}")
    
    def _initialize_provider(self) -> BasePIXProvider:
        """
        Initialize PIX provider based on configuration.
        
        Priority:
        1. PIX_MOCK_ENABLED=True → MockProvider (backward compatibility)
        2. PIX_PROVIDER=mock → MockProvider
        3. PIX_PROVIDER=starkbank → StarkBankProvider (if credentials available)
        4. Fallback to MockProvider
        
        Returns:
            Initialized provider instance
        """
        # Backward compatibility: check PIX_MOCK_ENABLED first
        if settings.pix_mock_enabled:
            logger.info("PIX_MOCK_ENABLED=True - using MockProvider")
            return MockProvider()
        
        # New way: check PIX_PROVIDER
        provider_name = getattr(settings, 'pix_provider', 'mock').lower()
        
        if provider_name == 'mock':
            logger.info("PIX_PROVIDER=mock - using MockProvider")
            return MockProvider()
        
        elif provider_name == 'starkbank':
            if StarkBankProvider is None:
                logger.warning(
                    "PIX_PROVIDER=starkbank but StarkBankProvider is not available. "
                    "Falling back to MockProvider."
                )
                return MockProvider()
            
            # Check if credentials are available
            has_credentials = (
                hasattr(settings, 'starkbank_project_id') and 
                settings.starkbank_project_id and
                hasattr(settings, 'starkbank_private_key') and 
                settings.starkbank_private_key
            )
            
            if has_credentials:
                try:
                    logger.info("PIX_PROVIDER=starkbank - initializing StarkBankProvider")
                    return StarkBankProvider()
                except Exception as e:
                    logger.error(f"Failed to initialize StarkBankProvider: {e}")
                    logger.warning("Falling back to MockProvider")
                    return MockProvider()
            else:
                logger.warning(
                    "PIX_PROVIDER=starkbank but credentials not configured. "
                    "Set STARKBANK_PROJECT_ID and STARKBANK_PRIVATE_KEY. "
                    "Falling back to MockProvider."
                )
                return MockProvider()
        
        else:
            logger.warning(
                f"Unknown PIX_PROVIDER={provider_name}. "
                "Valid options: mock, starkbank. Falling back to MockProvider."
            )
            return MockProvider()
    
    def generate_pix_qr_code(
        self,
        pix_key: str,
        amount: float,
        recipient_name: str = "PolkaPay LP",
        city: str = "Sao Paulo"
    ) -> Dict[str, Any]:
        """
        Generate PIX QR Code for payment.
        
        Delegates to the configured provider.
        
        Args:
            pix_key: PIX key (CPF, email, phone, or random key)
            amount: Payment amount in BRL
            recipient_name: Name of the recipient
            city: City of the recipient
            
        Returns:
            Dict containing:
                - txid: Transaction ID
                - qr_code: QR code string
                - qr_code_image: Base64 encoded QR code image
                - pix_key: PIX key used
                - amount: Payment amount
                
        Raises:
            Exception: If QR code generation fails
        """
        return self.provider.generate_pix_qr_code(
            pix_key=pix_key,
            amount=amount,
            recipient_name=recipient_name,
            city=city
        )
    
    def verify_payment(self, txid: str) -> Optional[Dict[str, Any]]:
        """
        Verify PIX payment status.
        
        Delegates to the configured provider.
        
        Args:
            txid: Transaction ID to verify
            
        Returns:
            Dict with payment information or None if not found
        """
        return self.provider.verify_payment(txid)
    
    def validate_pix_key(self, pix_key: str, key_type: str) -> bool:
        """
        Validate PIX key format.
        
        Delegates to the configured provider.
        
        Args:
            pix_key: PIX key to validate
            key_type: Type of key (cpf, email, phone, random)
            
        Returns:
            True if key is valid, False otherwise
        """
        return self.provider.validate_pix_key(pix_key, key_type)
    
    def mock_confirm_payment(self, txid: str) -> bool:
        """
        MOCK: Manually confirm a payment (for testing only).
        
        This method is only available when using MockProvider.
        In production with real providers, payments are confirmed via webhook.
        
        Args:
            txid: Transaction ID to confirm
            
        Returns:
            True if confirmed, False if transaction not found or not using mock
        """
        if isinstance(self.provider, MockProvider):
            return self.provider.mock_confirm_payment(txid)
        else:
            self.logger.warning(
                "mock_confirm_payment() is only available with MockProvider. "
                "Real providers use webhooks for payment confirmation."
            )
            return False


# Global instance
pix_service = PIXService()

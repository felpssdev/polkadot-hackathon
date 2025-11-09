"""
Base PIX Provider Interface

Abstract base class that all PIX providers must implement.
This ensures consistent interface across different providers.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class BasePIXProvider(ABC):
    """
    Abstract base class for PIX payment providers.
    
    All PIX providers must implement these methods to ensure
    consistent behavior across different implementations.
    """
    
    def __init__(self):
        """Initialize the provider"""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    @abstractmethod
    def generate_pix_qr_code(
        self,
        pix_key: str,
        amount: float,
        recipient_name: str = "PolkaPay LP",
        city: str = "Sao Paulo"
    ) -> Dict[str, Any]:
        """
        Generate PIX QR Code for payment.
        
        Args:
            pix_key: PIX key (CPF, email, phone, or random key)
            amount: Payment amount in BRL
            recipient_name: Name of the recipient
            city: City of the recipient
            
        Returns:
            Dict containing:
                - txid: Transaction ID
                - qr_code: QR code string (EMV format)
                - qr_code_image: Base64 encoded QR code image
                - pix_key: PIX key used
                - amount: Payment amount
                
        Raises:
            Exception: If QR code generation fails
        """
        pass
    
    @abstractmethod
    def verify_payment(self, txid: str) -> Optional[Dict[str, Any]]:
        """
        Verify PIX payment status.
        
        Args:
            txid: Transaction ID to verify
            
        Returns:
            Dict containing payment information:
                - txid: Transaction ID
                - status: Payment status (pending, confirmed, failed)
                - amount: Payment amount
                - pix_key: PIX key used
            None if transaction not found
            
        Raises:
            Exception: If verification fails
        """
        pass
    
    @abstractmethod
    def validate_pix_key(self, pix_key: str, key_type: str) -> bool:
        """
        Validate PIX key format.
        
        Args:
            pix_key: PIX key to validate
            key_type: Type of key (cpf, email, phone, random)
            
        Returns:
            True if key is valid, False otherwise
        """
        pass
    
    def _handle_error(self, error: Exception, operation: str) -> None:
        """
        Common error handling for all providers.
        
        Args:
            error: Exception that occurred
            operation: Name of the operation that failed
        """
        self.logger.error(f"Error in {operation}: {error}", exc_info=True)


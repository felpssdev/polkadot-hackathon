"""
Mock PIX Provider

MOCK: This is a mock implementation for development and testing.
In production, use a real provider like Stark Bank.

This provider simulates PIX payment operations without actual bank integration.
All transactions are stored in memory and will be lost on restart.
"""
import qrcode
import io
import base64
import random
import string
from typing import Dict, Any, Optional
import logging

from .base import BasePIXProvider

logger = logging.getLogger(__name__)


class MockProvider(BasePIXProvider):
    """
    MOCK: Mock PIX provider for development/testing.
    
    This provider simulates PIX operations:
    - Generates fake transaction IDs
    - Creates QR codes with simplified payload
    - Stores transactions in memory
    - Allows manual payment confirmation for testing
    
    WARNING: This is NOT a real PIX implementation.
    Use only for development and testing.
    """
    
    def __init__(self):
        """Initialize mock provider with in-memory transaction storage"""
        super().__init__()
        # MOCK: In-memory transaction storage (lost on restart)
        self.mock_transactions: Dict[str, Dict] = {}
        self.logger.warning("PIX service is using MOCK mode - transactions are simulated")
    
    def generate_pix_qr_code(
        self,
        pix_key: str,
        amount: float,
        recipient_name: str = "PolkaPay LP",
        city: str = "Sao Paulo"
    ) -> Dict[str, Any]:
        """
        MOCK: Generate simulated PIX QR Code.
        
        In production, this would use a proper PIX API (Stark Bank, etc.)
        For now, it generates a simplified QR code payload.
        
        Args:
            pix_key: PIX key (CPF, email, phone, or random key)
            amount: Payment amount in BRL
            recipient_name: Name of the recipient
            city: City of the recipient
            
        Returns:
            Dict containing mock transaction data
        """
        try:
            # MOCK: Generate fake transaction ID
            txid = self._generate_txid()
            
            # MOCK: Generate simplified PIX payload
            # In production, use proper EMV QR Code format:
            # https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
            pix_payload = self._generate_pix_payload(
                pix_key=pix_key,
                amount=amount,
                recipient_name=recipient_name,
                city=city,
                txid=txid
            )
            
            # Generate QR code image
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(pix_payload)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            img_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # MOCK: Store transaction in memory
            self.mock_transactions[txid] = {
                "txid": txid,
                "pix_key": pix_key,
                "amount": amount,
                "status": "pending",
                "qr_code": pix_payload,
                "recipient_name": recipient_name,
                "city": city
            }
            
            self.logger.info(f"MOCK: Generated PIX QR code for {amount} BRL to {pix_key} (TXID: {txid})")
            
            return {
                "txid": txid,
                "qr_code": pix_payload,
                "qr_code_image": f"data:image/png;base64,{img_base64}",
                "pix_key": pix_key,
                "amount": amount
            }
            
        except Exception as e:
            self._handle_error(e, "generate_pix_qr_code")
            raise
    
    def verify_payment(self, txid: str) -> Optional[Dict[str, Any]]:
        """
        MOCK: Verify simulated PIX payment.
        
        In production, this would check with the bank API.
        For now, it checks the in-memory transaction store.
        
        Args:
            txid: Transaction ID to verify
            
        Returns:
            Dict with transaction info if found, None otherwise
        """
        try:
            # MOCK: Check in-memory transactions
            transaction = self.mock_transactions.get(txid)
            if transaction:
                self.logger.info(f"MOCK: Verified payment {txid} - Status: {transaction['status']}")
                return {
                    "txid": txid,
                    "status": transaction["status"],
                    "amount": transaction["amount"],
                    "pix_key": transaction["pix_key"]
                }
            
            # MOCK: Transaction not found
            self.logger.warning(f"MOCK: Payment {txid} not found in mock transactions")
            return None
            
        except Exception as e:
            self._handle_error(e, "verify_payment")
            return None
    
    def validate_pix_key(self, pix_key: str, key_type: str) -> bool:
        """
        MOCK: Validate PIX key format.
        
        Basic validation - in production, use proper validation
        that checks with the bank/PIX registry.
        
        Args:
            pix_key: PIX key to validate
            key_type: Type of key (cpf, email, phone, random)
            
        Returns:
            True if key format is valid, False otherwise
        """
        try:
            if key_type == "cpf":
                # Remove formatting
                cpf = ''.join(filter(str.isdigit, pix_key))
                return len(cpf) == 11
            elif key_type == "email":
                return "@" in pix_key and "." in pix_key
            elif key_type == "phone":
                phone = ''.join(filter(str.isdigit, pix_key))
                return len(phone) >= 10
            elif key_type == "random":
                return len(pix_key) == 32  # EVP format
            
            return False
            
        except Exception as e:
            self._handle_error(e, "validate_pix_key")
            return False
    
    def mock_confirm_payment(self, txid: str) -> bool:
        """
        MOCK: Manually confirm a payment (for testing only).
        
        This method simulates payment confirmation.
        In production, payments are confirmed via webhook from the bank.
        
        Args:
            txid: Transaction ID to confirm
            
        Returns:
            True if confirmed, False if transaction not found
        """
        if txid in self.mock_transactions:
            self.mock_transactions[txid]["status"] = "confirmed"
            self.logger.info(f"MOCK: Payment {txid} manually confirmed (testing only)")
            return True
        return False
    
    def _generate_txid(self) -> str:
        """
        MOCK: Generate fake transaction ID.
        
        In production, transaction IDs come from the bank/PIX system.
        """
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choice(chars) for _ in range(25))
    
    def _generate_pix_payload(
        self,
        pix_key: str,
        amount: float,
        recipient_name: str,
        city: str,
        txid: str
    ) -> str:
        """
        MOCK: Generate simplified PIX payload.
        
        In production, use proper EMV QR Code format as specified by Banco Central:
        https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
        
        This is a simplified version for testing only.
        """
        # Simplified version - in production use proper EMV format
        payload = f"PIX|KEY:{pix_key}|AMOUNT:{amount:.2f}|TXID:{txid}|NAME:{recipient_name}|CITY:{city}"
        return payload


import qrcode
import io
import base64
from typing import Dict, Any, Optional
import random
import string
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class PIXService:
    """Service for PIX payment integration (Mock)"""
    
    def __init__(self):
        self.mock_enabled = settings.pix_mock_enabled
        self.mock_transactions: Dict[str, Dict] = {}
    
    def generate_pix_qr_code(
        self,
        pix_key: str,
        amount: float,
        recipient_name: str = "PolkaPay LP",
        city: str = "Sao Paulo"
    ) -> Dict[str, Any]:
        """
        Generate PIX QR Code
        
        In production, this would use a proper PIX API (Stark Bank, etc.)
        For now, it's mocked
        """
        try:
            # Generate txid
            txid = self._generate_txid()
            
            # PIX payload (simplified - real PIX uses EMV format)
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
            
            # Store mock transaction
            if self.mock_enabled:
                self.mock_transactions[txid] = {
                    "txid": txid,
                    "pix_key": pix_key,
                    "amount": amount,
                    "status": "pending",
                    "qr_code": pix_payload
                }
            
            logger.info(f"Generated PIX QR code for {amount} BRL to {pix_key}")
            
            return {
                "txid": txid,
                "qr_code": pix_payload,
                "qr_code_image": f"data:image/png;base64,{img_base64}",
                "pix_key": pix_key,
                "amount": amount
            }
            
        except Exception as e:
            logger.error(f"Error generating PIX QR code: {e}")
            raise
    
    def verify_payment(self, txid: str) -> Optional[Dict[str, Any]]:
        """
        Verify PIX payment
        
        In production, this would check with the bank API
        """
        try:
            if self.mock_enabled:
                transaction = self.mock_transactions.get(txid)
                if transaction:
                    return {
                        "txid": txid,
                        "status": transaction["status"],
                        "amount": transaction["amount"],
                        "pix_key": transaction["pix_key"]
                    }
            
            # In production: call bank API to verify payment
            logger.info(f"Verifying PIX payment {txid}")
            return None
            
        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            return None
    
    def mock_confirm_payment(self, txid: str) -> bool:
        """Mock: Simulate payment confirmation (for testing)"""
        if txid in self.mock_transactions:
            self.mock_transactions[txid]["status"] = "confirmed"
            logger.info(f"Mock: Payment {txid} confirmed")
            return True
        return False
    
    def _generate_txid(self) -> str:
        """Generate transaction ID"""
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
        Generate PIX payload (simplified)
        
        In production, use proper EMV QR Code format:
        https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
        """
        # Simplified version - in production use proper EMV format
        payload = f"PIX|KEY:{pix_key}|AMOUNT:{amount:.2f}|TXID:{txid}|NAME:{recipient_name}|CITY:{city}"
        return payload
    
    def validate_pix_key(self, pix_key: str, key_type: str) -> bool:
        """Validate PIX key format"""
        # Basic validation - in production, use proper validation
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


# Global instance
pix_service = PIXService()


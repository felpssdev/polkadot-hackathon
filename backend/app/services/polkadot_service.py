from substrateinterface import SubstrateInterface, Keypair
try:
    from substrateinterface import ContractInstance, ContractCode
except ImportError:
    # Optional imports for contract support
    ContractInstance = None
    ContractCode = None
from substrateinterface.exceptions import SubstrateRequestException
from typing import Optional, Dict, Any
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class PolkadotService:
    """Service for interacting with Polkadot/Substrate blockchain"""
    
    def __init__(self):
        self.substrate: Optional[SubstrateInterface] = None
        self.contract: Optional[ContractInstance] = None
        self.keypair: Optional[Keypair] = None
        
    def connect(self):
        """Connect to Polkadot node"""
        try:
            self.substrate = SubstrateInterface(
                url=settings.polkadot_node_url,
                ss58_format=42,  # Generic Substrate
                type_registry_preset='rococo'
            )
            logger.info(f"Connected to {settings.polkadot_node_url}")
            
            # Load keypair if seed is provided
            if settings.signer_seed:
                self.keypair = Keypair.create_from_uri(settings.signer_seed)
                logger.info(f"Loaded keypair: {self.keypair.ss58_address}")
                
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Polkadot: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from Polkadot node"""
        if self.substrate:
            self.substrate.close()
            logger.info("Disconnected from Polkadot")
    
    def get_balance(self, address: str) -> float:
        """Get DOT balance of an address"""
        try:
            if not self.substrate:
                self.connect()
                
            result = self.substrate.query(
                module='System',
                storage_function='Account',
                params=[address]
            )
            
            # Convert from Planck to DOT (1 DOT = 10^10 Planck on Rococo)
            balance = result.value['data']['free'] / (10 ** 10)
            return balance
        except Exception as e:
            logger.error(f"Error getting balance: {e}")
            return 0.0
    
    def create_order(self, dot_amount: float) -> Optional[Dict[str, Any]]:
        """Create order on smart contract"""
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            # Convert DOT to Planck
            amount_planck = int(dot_amount * (10 ** 10))
            
            # Call contract (placeholder - needs actual contract instance)
            # This is a simplified version
            logger.info(f"Creating order for {dot_amount} DOT")
            
            # TODO: Actual contract call
            # result = self.contract.exec(
            #     keypair=self.keypair,
            #     method='create_order',
            #     args={},
            #     value=amount_planck
            # )
            
            return {
                "order_id": 1,  # Mock
                "tx_hash": "0x123...",
                "block_number": 12345
            }
            
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            return None
    
    def accept_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Accept order on smart contract"""
        try:
            if not self.substrate or not self.keypair:
                return None
            
            logger.info(f"Accepting order {order_id}")
            
            # TODO: Actual contract call
            # result = self.contract.exec(
            #     keypair=self.keypair,
            #     method='accept_order',
            #     args={'order_id': order_id}
            # )
            
            return {
                "tx_hash": "0x456...",
                "block_number": 12346
            }
            
        except Exception as e:
            logger.error(f"Error accepting order: {e}")
            return None
    
    def complete_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Complete order and release funds"""
        try:
            if not self.substrate or not self.keypair:
                return None
            
            logger.info(f"Completing order {order_id}")
            
            # TODO: Actual contract call
            # result = self.contract.exec(
            #     keypair=self.keypair,
            #     method='complete_order',
            #     args={'order_id': order_id}
            # )
            
            return {
                "tx_hash": "0x789...",
                "block_number": 12347
            }
            
        except Exception as e:
            logger.error(f"Error completing order: {e}")
            return None
    
    def cancel_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Cancel order and refund"""
        try:
            if not self.substrate or not self.keypair:
                return None
            
            logger.info(f"Cancelling order {order_id}")
            
            # TODO: Actual contract call
            
            return {
                "tx_hash": "0xabc...",
                "block_number": 12348
            }
            
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return None
    
    def verify_signature(self, wallet_address: str, message: str, signature: str) -> bool:
        """Verify wallet signature for authentication"""
        try:
            keypair = Keypair(ss58_address=wallet_address)
            is_valid = keypair.verify(message, signature)
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying signature: {e}")
            return False


# Global instance
polkadot_service = PolkadotService()


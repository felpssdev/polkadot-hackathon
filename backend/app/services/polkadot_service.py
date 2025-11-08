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
import json
import os

from app.config import settings

logger = logging.getLogger(__name__)


class PolkadotService:
    """Service for interacting with Polkadot/Substrate blockchain"""
    
    def __init__(self):
        self.substrate: Optional[SubstrateInterface] = None
        self.contract: Optional[ContractInstance] = None
        self.contract_metadata: Optional[Dict] = None
        self.contract_address: Optional[str] = None
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
    
    def create_order(self, order_type: str, dot_amount: float) -> Optional[Dict[str, Any]]:
        """Create order on smart contract
        
        Args:
            order_type: "Sell" or "Buy"
            dot_amount: Amount of DOT for the order
            
        Returns:
            Dict with order_id, tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            # Convert order type to enum (0=Sell, 1=Buy)
            order_type_enum = 0 if order_type.lower() == "sell" else 1
            
            # Convert DOT to Planck (10^10 for Rococo)
            amount_planck = int(dot_amount * (10 ** 10))
            
            # For Sell orders, send DOT as value; for Buy orders, value=0
            value = amount_planck if order_type.lower() == "sell" else 0
            
            logger.info(f"Creating {order_type} order for {dot_amount} DOT (value: {value} Planck)")
            
            # Execute contract call
            gas_limit = {
                'ref_time': 10000000000,  # 10 billion
                'proof_size': 1000000      # 1 MB
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='create_order',
                args={'order_type': order_type_enum},
                value=value,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                # Extract order_id from contract result
                # The contract returns the order_id as u32
                order_id = receipt.contract_result_data
                
                logger.info(f"Order created successfully: ID={order_id}, TX={receipt.extrinsic_hash}")
                
                return {
                    "order_id": order_id,
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error creating order: {e}", exc_info=True)
            return None
    
    def accept_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Accept Sell order on smart contract (LP doesn't deposit DOT)
        
        Args:
            order_id: Order ID to accept
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Accepting Sell order {order_id}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='accept_order',
                args={'order_id': order_id},
                value=0,  # No DOT deposit for Sell orders
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Order {order_id} accepted successfully, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error accepting order: {e}", exc_info=True)
            return None
    
    def accept_buy_order(self, order_id: int, dot_amount: float) -> Optional[Dict[str, Any]]:
        """Accept Buy order on smart contract (LP deposits DOT)
        
        Args:
            order_id: Order ID to accept
            dot_amount: Amount of DOT to deposit
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            # Convert DOT to Planck
            amount_planck = int(dot_amount * (10 ** 10))
            
            logger.info(f"Accepting Buy order {order_id} with {dot_amount} DOT deposit")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='accept_buy_order',
                args={'order_id': order_id},
                value=amount_planck,  # LP deposits DOT for Buy orders
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Buy order {order_id} accepted successfully, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error accepting buy order: {e}", exc_info=True)
            return None
    
    def confirm_payment_sent(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Mark payment as sent on smart contract
        
        Args:
            order_id: Order ID to update
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Confirming payment sent for order {order_id}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='confirm_payment_sent',
                args={'order_id': order_id},
                value=0,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Payment confirmed for order {order_id}, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error confirming payment: {e}", exc_info=True)
            return None
    
    def complete_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Complete order and release funds
        
        Args:
            order_id: Order ID to complete
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Completing order {order_id}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='complete_order',
                args={'order_id': order_id},
                value=0,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Order {order_id} completed successfully, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error completing order: {e}", exc_info=True)
            return None
    
    def cancel_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Cancel order and refund
        
        Args:
            order_id: Order ID to cancel
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Cancelling order {order_id}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='cancel_order',
                args={'order_id': order_id},
                value=0,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Order {order_id} cancelled successfully, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error cancelling order: {e}", exc_info=True)
            return None
    
    def create_dispute(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Create dispute for an order
        
        Args:
            order_id: Order ID to dispute
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Creating dispute for order {order_id}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='create_dispute',
                args={'order_id': order_id},
                value=0,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Dispute created for order {order_id}, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error creating dispute: {e}", exc_info=True)
            return None
    
    def resolve_dispute(self, order_id: int, favor_buyer: bool) -> Optional[Dict[str, Any]]:
        """Resolve dispute (admin only)
        
        Args:
            order_id: Order ID to resolve
            favor_buyer: True to favor buyer, False to favor seller
            
        Returns:
            Dict with tx_hash, block_number or None on failure
        """
        try:
            if not self.substrate or not self.keypair:
                logger.error("Not connected or no keypair")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Resolving dispute for order {order_id}, favor_buyer={favor_buyer}")
            
            gas_limit = {
                'ref_time': 10000000000,
                'proof_size': 1000000
            }
            
            receipt = self.contract.exec(
                keypair=self.keypair,
                method='resolve_dispute',
                args={'order_id': order_id, 'favor_buyer': favor_buyer},
                value=0,
                gas_limit=gas_limit
            )
            
            if receipt.is_success:
                logger.info(f"Dispute resolved for order {order_id}, TX={receipt.extrinsic_hash}")
                return {
                    "tx_hash": receipt.extrinsic_hash,
                    "block_number": receipt.block_number
                }
            else:
                logger.error(f"Contract call failed: {receipt.error_message}")
                return None
            
        except Exception as e:
            logger.error(f"Error resolving dispute: {e}", exc_info=True)
            return None
    
    def get_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Get order details from blockchain (read-only)
        
        Args:
            order_id: Order ID to query
            
        Returns:
            Dict with order details or None on failure
        """
        try:
            if not self.substrate:
                logger.error("Not connected")
                return None
            
            if not self.contract:
                logger.error("Contract not loaded")
                return None
            
            logger.info(f"Querying order {order_id} from blockchain")
            
            # Read-only call (doesn't require keypair or gas)
            result = self.contract.read(
                keypair=self.keypair,  # Can be None for read calls
                method='get_order',
                args={'order_id': order_id}
            )
            
            if result.contract_result_data:
                order = result.contract_result_data
                
                # Convert Planck to DOT
                amount_dot = order.get('amount', 0) / (10 ** 10)
                lp_fee_dot = order.get('lp_fee', 0) / (10 ** 10)
                
                # Map status enum to string
                status_map = {
                    0: "Pending",
                    1: "Accepted",
                    2: "PaymentSent",
                    3: "Completed",
                    4: "Cancelled",
                    5: "Disputed"
                }
                
                # Map order type enum to string
                order_type = "Sell" if order.get('order_type', 0) == 0 else "Buy"
                
                return {
                    "id": order.get('id'),
                    "order_type": order_type,
                    "buyer": order.get('buyer'),
                    "seller": order.get('seller'),
                    "amount": amount_dot,
                    "lp_fee": lp_fee_dot,
                    "status": status_map.get(order.get('status'), "Unknown"),
                    "created_at": order.get('created_at')
                }
            else:
                logger.warning(f"Order {order_id} not found on blockchain")
                return None
            
        except Exception as e:
            logger.error(f"Error getting order from blockchain: {e}", exc_info=True)
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
    
    def load_contract(self, contract_address: str, metadata_path: str) -> bool:
        """Load contract instance from metadata"""
        try:
            # Check if metadata file exists
            if not os.path.exists(metadata_path):
                logger.warning(f"Contract metadata not found at {metadata_path}")
                return False
            
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Store for future use
            self.contract_metadata = metadata
            self.contract_address = contract_address
            
            logger.info(f"Contract metadata loaded for {contract_address}")
            logger.info(f"Metadata path: {metadata_path}")
            
            # If substrate is connected and ContractInstance is available, create instance
            if self.substrate and ContractInstance:
                try:
                    self.contract = ContractInstance.create_from_address(
                        contract_address=contract_address,
                        metadata_file=metadata_path,
                        substrate=self.substrate
                    )
                    logger.info("Contract instance created successfully")
                except Exception as e:
                    logger.warning(f"Could not create contract instance: {e}")
                    logger.info("Contract metadata loaded but instance not created")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to load contract: {e}")
            return False
    
    def estimate_gas(self, method: str, args: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Estimate gas for contract method call"""
        try:
            if not self.contract or not self.keypair:
                logger.warning("Contract or keypair not initialized for gas estimation")
                return None
            
            # Placeholder for gas estimation
            # In real implementation, would call contract.read() to estimate
            return {
                "ref_time": 10000000000,
                "proof_size": 1000000
            }
            
        except Exception as e:
            logger.error(f"Error estimating gas: {e}")
            return None


# Global instance
polkadot_service = PolkadotService()


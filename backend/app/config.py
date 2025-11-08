from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    app_name: str = "PolkaPay"
    app_version: str = "1.0.0"
    debug: bool = True
    api_prefix: str = "/api/v1"
    
    # Database
    database_url: str = "postgresql://polkapay:polkapay123@localhost:5432/polkapay"
    
    # Polkadot
    polkadot_node_url: str = "wss://rococo-rpc.polkadot.io"
    contract_address: Optional[str] = None
    signer_seed: Optional[str] = None
    
    # Contract
    contract_metadata_path: str = "contracts/target/ink/metadata.json"
    contract_wasm_path: str = "contracts/target/ink/polkapay_escrow.wasm"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Security
    secret_key: str = "your-secret-key-change-this"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # PIX
    pix_mock_enabled: bool = True
    
    # Limits
    default_buy_limit_usd: float = 1.0
    default_buy_orders_per_day: int = 1
    default_sell_limit_usd: float = 100.0
    default_sell_orders_per_day: int = 10
    
    # LP Fee
    lp_fee_percentage: float = 2.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


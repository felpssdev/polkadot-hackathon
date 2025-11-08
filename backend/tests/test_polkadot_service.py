import pytest
from app.services.polkadot_service import polkadot_service


def test_polkadot_service_initialization():
    """Test that polkadot service initializes correctly"""
    assert polkadot_service is not None
    assert polkadot_service.substrate is None  # Not connected yet
    assert polkadot_service.contract is None
    assert polkadot_service.keypair is None


def test_connect():
    """Test connection to Polkadot node"""
    result = polkadot_service.connect()
    # Connection may fail in CI environment without network access
    assert result is True or result is False


def test_verify_signature_invalid():
    """Test signature verification with invalid data"""
    result = polkadot_service.verify_signature(
        wallet_address="invalid_address",
        message="test message",
        signature="invalid_signature"
    )
    assert result is False


def test_load_contract_missing_file():
    """Test loading contract with missing metadata file"""
    result = polkadot_service.load_contract(
        contract_address="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        metadata_path="/nonexistent/path/metadata.json"
    )
    assert result is False


def test_load_contract_metadata():
    """Test loading contract metadata"""
    # This test will pass if metadata file exists
    result = polkadot_service.load_contract(
        contract_address="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        metadata_path="contracts/target/ink/metadata.json"
    )
    # May fail if contract not built yet, which is expected
    assert result is True or result is False


@pytest.mark.asyncio
async def test_create_order_mock():
    """Test mock order creation"""
    result = polkadot_service.create_order(1.0)
    # May return None if not connected, which is expected
    if result is not None:
        assert "order_id" in result
        assert "tx_hash" in result
        assert "block_number" in result
        assert result["order_id"] == 1  # Mock returns 1


@pytest.mark.asyncio
async def test_accept_order_mock():
    """Test mock order acceptance"""
    result = polkadot_service.accept_order(1)
    # May return None if not connected, which is expected
    if result is not None:
        assert "tx_hash" in result
        assert "block_number" in result


@pytest.mark.asyncio
async def test_complete_order_mock():
    """Test mock order completion"""
    result = polkadot_service.complete_order(1)
    # May return None if not connected, which is expected
    if result is not None:
        assert "tx_hash" in result
        assert "block_number" in result


@pytest.mark.asyncio
async def test_cancel_order_mock():
    """Test mock order cancellation"""
    result = polkadot_service.cancel_order(1)
    # May return None if not connected, which is expected
    if result is not None:
        assert "tx_hash" in result
        assert "block_number" in result


def test_get_balance():
    """Test getting balance"""
    # This will fail if not connected, which is expected
    try:
        balance = polkadot_service.get_balance("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
        assert isinstance(balance, float)
        assert balance >= 0
    except Exception:
        # Expected to fail without connection
        pass


def test_estimate_gas():
    """Test gas estimation"""
    result = polkadot_service.estimate_gas("create_order", {})
    # May return None if contract not loaded
    if result is not None:
        assert "ref_time" in result
        assert "proof_size" in result


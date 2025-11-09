"""
PIX Provider implementations

This package contains different PIX provider implementations:
- MockProvider: Mock implementation for development/testing
- StarkBankProvider: Real Stark Bank integration (skeleton ready)
"""

from .base import BasePIXProvider
from .mock_provider import MockProvider

# StarkBankProvider is optional (skeleton only)
try:
    from .starkbank_provider import StarkBankProvider
    __all__ = ["BasePIXProvider", "MockProvider", "StarkBankProvider"]
except ImportError:
    __all__ = ["BasePIXProvider", "MockProvider"]


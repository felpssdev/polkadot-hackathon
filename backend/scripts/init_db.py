"""
Initialize database with sample data
"""
import sys
sys.path.append(".")

from app.database import SessionLocal, engine, Base
from app.models import User, LiquidityProvider


def init_db():
    """Initialize database with tables and sample data"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if we already have data
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"ℹ️  Database already has {existing_users} users")
            return
        
        # Create sample users
        user1 = User(
            wallet_address="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            buy_limit_usd=1.0,
            buy_orders_per_day=1,
            sell_limit_usd=100.0,
            sell_orders_per_day=10
        )
        
        user2 = User(
            wallet_address="5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            buy_limit_usd=1.0,
            buy_orders_per_day=1,
            sell_limit_usd=100.0,
            sell_orders_per_day=10
        )
        
        db.add(user1)
        db.add(user2)
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        
        print(f"✅ Created sample user 1: {user1.wallet_address}")
        print(f"✅ Created sample user 2: {user2.wallet_address}")
        
        # Create sample LP
        lp1 = LiquidityProvider(
            user_id=user2.id,
            pix_key="lp@polkapay.com",
            pix_key_type="email",
            is_active=True,
            is_available=True
        )
        
        db.add(lp1)
        db.commit()
        
        print(f"✅ Created sample LP: {lp1.pix_key}")
        print("\n✨ Database initialized successfully!")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()


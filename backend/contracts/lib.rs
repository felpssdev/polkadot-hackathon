#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polkapay_escrow {
    use ink::storage::Mapping;

    /// Order type
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[derive(Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum OrderType {
        Sell,  // User sells DOT (locks DOT)
        Buy,   // User buys DOT (LP locks DOT)
    }

    /// Order status
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[derive(Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub enum OrderStatus {
        Pending,
        Accepted,
        PaymentSent,
        Completed,
        Disputed,
        Cancelled,
    }

    /// Order structure
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[derive(Debug, Clone, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Order {
        pub id: u64,
        pub order_type: OrderType,
        pub buyer: AccountId,
        pub seller: Option<AccountId>,
        pub amount: Balance,
        pub lp_fee: Balance,
        pub status: OrderStatus,
        pub created_at: u64,
    }

    /// Contract storage
    #[ink(storage)]
    pub struct PolkaPayEscrow {
        /// Owner of the contract
        owner: AccountId,
        /// Emergency pause flag
        paused: bool,
        /// Next order ID
        next_order_id: u64,
        /// Orders mapping
        orders: Mapping<u64, Order>,
        /// LP fee percentage (in basis points, e.g., 200 = 2%)
        lp_fee_bps: u16,
    }

    /// Events
    #[ink(event)]
    pub struct OrderCreated {
        #[ink(topic)]
        order_id: u64,
        #[ink(topic)]
        buyer: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct OrderAccepted {
        #[ink(topic)]
        order_id: u64,
        #[ink(topic)]
        seller: AccountId,
    }

    #[ink(event)]
    pub struct OrderCompleted {
        #[ink(topic)]
        order_id: u64,
    }

    #[ink(event)]
    pub struct OrderCancelled {
        #[ink(topic)]
        order_id: u64,
    }

    #[ink(event)]
    pub struct DisputeCreated {
        #[ink(topic)]
        order_id: u64,
        #[ink(topic)]
        initiator: AccountId,
    }

    #[ink(event)]
    pub struct DisputeResolved {
        #[ink(topic)]
        order_id: u64,
        favor_buyer: bool,
    }

    /// Errors
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[derive(Debug, PartialEq, Eq)]
    pub enum Error {
        OrderNotFound,
        Unauthorized,
        InvalidStatus,
        InsufficientBalance,
        TransferFailed,
        ContractPaused,
        InvalidOrderType,
        InvalidAmount,
    }

    impl PolkaPayEscrow {
        /// Constructor
        #[ink(constructor)]
        pub fn new(lp_fee_bps: u16) -> Self {
            Self {
                owner: Self::env().caller(),
                paused: false,
                next_order_id: 1,
                orders: Mapping::default(),
                lp_fee_bps,
            }
        }

        /// Create a new order
        #[ink(message, payable)]
        pub fn create_order(&mut self, order_type: OrderType) -> Result<u64, Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // For SELL: user deposits DOT
            // For BUY: user does NOT deposit (LP will deposit later)
            if order_type == OrderType::Sell && amount == 0 {
                return Err(Error::InsufficientBalance);
            }
            if order_type == OrderType::Buy && amount != 0 {
                return Err(Error::InvalidAmount);
            }

            let order_id = self.next_order_id;
            
            // Calculate fee based on amount (for sell) or will be set when LP accepts (for buy)
            let (final_amount, lp_fee) = if order_type == OrderType::Sell {
                let fee = amount
                    .checked_mul(self.lp_fee_bps as u128)
                    .and_then(|v| v.checked_div(10000))
                    .ok_or(Error::InsufficientBalance)?;
                (amount, fee)
            } else {
                // For buy orders, amount will be set when LP accepts
                (0, 0)
            };

            let order = Order {
                id: order_id,
                order_type,
                buyer: caller,
                seller: None,
                amount: final_amount,
                lp_fee,
                status: OrderStatus::Pending,
                created_at: self.env().block_timestamp(),
            };

            self.orders.insert(order_id, &order);
            self.next_order_id = self.next_order_id.checked_add(1).ok_or(Error::InsufficientBalance)?;

            self.env().emit_event(OrderCreated {
                order_id,
                buyer: caller,
                amount: final_amount,
            });

            Ok(order_id)
        }

        /// LP accepts SELL order (no deposit needed, DOT already locked by user)
        #[ink(message)]
        pub fn accept_order(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            // Only for SELL orders
            if order.order_type != OrderType::Sell {
                return Err(Error::InvalidOrderType);
            }

            if order.status != OrderStatus::Pending {
                return Err(Error::InvalidStatus);
            }

            order.seller = Some(caller);
            order.status = OrderStatus::Accepted;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderAccepted {
                order_id,
                seller: caller,
            });

            Ok(())
        }

        /// LP accepts BUY order and deposits DOT
        #[ink(message, payable)]
        pub fn accept_buy_order(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let transferred = self.env().transferred_value();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            // Only for BUY orders
            if order.order_type != OrderType::Buy {
                return Err(Error::InvalidOrderType);
            }

            if order.status != OrderStatus::Pending {
                return Err(Error::InvalidStatus);
            }

            if transferred == 0 {
                return Err(Error::InsufficientBalance);
            }

            // Calculate fee
            let lp_fee = transferred
                .checked_mul(self.lp_fee_bps as u128)
                .and_then(|v| v.checked_div(10000))
                .ok_or(Error::InsufficientBalance)?;

            // Update order with LP's deposit
            order.seller = Some(caller);
            order.amount = transferred;
            order.lp_fee = lp_fee;
            order.status = OrderStatus::Accepted;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderAccepted {
                order_id,
                seller: caller,
            });

            Ok(())
        }

        /// Mark payment as sent
        #[ink(message)]
        pub fn confirm_payment_sent(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            if order.buyer != caller {
                return Err(Error::Unauthorized);
            }

            if order.status != OrderStatus::Accepted {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::PaymentSent;
            self.orders.insert(order_id, &order);

            Ok(())
        }

        /// Complete order and release funds
        #[ink(message)]
        pub fn complete_order(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;
            let seller = order.seller.ok_or(Error::Unauthorized)?;

            // SECURITY: Only seller or buyer can complete
            if caller != seller && caller != order.buyer {
                return Err(Error::Unauthorized);
            }

            if order.status != OrderStatus::PaymentSent {
                return Err(Error::InvalidStatus);
            }

            // Calculate amounts
            let lp_payment = order.amount.checked_sub(order.lp_fee).ok_or(Error::InsufficientBalance)?;

            // SECURITY: Effects before interactions (reentrancy protection)
            order.status = OrderStatus::Completed;
            self.orders.insert(order_id, &order);

            // Interactions after state changes
            match order.order_type {
                OrderType::Sell => {
                    // LP receives DOT (already locked by user)
                    if self.env().transfer(seller, lp_payment).is_err() {
                        return Err(Error::TransferFailed);
                    }
                }
                OrderType::Buy => {
                    // User receives DOT (already locked by LP)
                    if self.env().transfer(order.buyer, lp_payment).is_err() {
                        return Err(Error::TransferFailed);
                    }
                }
            }

            // Fee always goes to owner
            if self.env().transfer(self.owner, order.lp_fee).is_err() {
                return Err(Error::TransferFailed);
            }

            self.env().emit_event(OrderCompleted { order_id });

            Ok(())
        }

        /// Cancel order and refund (only if not accepted yet)
        #[ink(message)]
        pub fn cancel_order(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            if order.buyer != caller {
                return Err(Error::Unauthorized);
            }

            if order.status != OrderStatus::Pending {
                return Err(Error::InvalidStatus);
            }

            // Effects first
            order.status = OrderStatus::Cancelled;
            self.orders.insert(order_id, &order);

            // Refund based on order type
            match order.order_type {
                OrderType::Sell => {
                    // Refund DOT to buyer (user who created sell order)
                    if order.amount > 0 {
                        if self.env().transfer(order.buyer, order.amount).is_err() {
                            return Err(Error::TransferFailed);
                        }
                    }
                }
                OrderType::Buy => {
                    // Buy orders don't have locked funds in Pending state
                    // Nothing to refund
                }
            }

            self.env().emit_event(OrderCancelled { order_id });

            Ok(())
        }

        /// Get order details
        #[ink(message)]
        pub fn get_order(&self, order_id: u64) -> Option<Order> {
            self.orders.get(order_id)
        }

        /// Get contract balance
        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            self.env().balance()
        }

        /// Pause contract (emergency stop)
        #[ink(message)]
        pub fn pause(&mut self) -> Result<(), Error> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }
            self.paused = true;
            Ok(())
        }

        /// Unpause contract
        #[ink(message)]
        pub fn unpause(&mut self) -> Result<(), Error> {
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }
            self.paused = false;
            Ok(())
        }

        /// Check if contract is paused
        #[ink(message)]
        pub fn is_paused(&self) -> bool {
            self.paused
        }

        /// Create a dispute
        #[ink(message)]
        pub fn create_dispute(&mut self, order_id: u64) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            // Only buyer or seller can create dispute
            if caller != order.buyer && Some(caller) != order.seller {
                return Err(Error::Unauthorized);
            }

            // Only in PaymentSent status
            if order.status != OrderStatus::PaymentSent {
                return Err(Error::InvalidStatus);
            }

            order.status = OrderStatus::Disputed;
            self.orders.insert(order_id, &order);

            self.env().emit_event(DisputeCreated {
                order_id,
                initiator: caller,
            });

            Ok(())
        }

        /// Resolve a dispute (owner only)
        #[ink(message)]
        pub fn resolve_dispute(&mut self, order_id: u64, favor_buyer: bool) -> Result<(), Error> {
            if self.paused {
                return Err(Error::ContractPaused);
            }

            // Only owner can resolve disputes
            if self.env().caller() != self.owner {
                return Err(Error::Unauthorized);
            }

            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;
            let seller = order.seller.ok_or(Error::Unauthorized)?;

            if order.status != OrderStatus::Disputed {
                return Err(Error::InvalidStatus);
            }

            let lp_payment = order.amount.checked_sub(order.lp_fee).ok_or(Error::InsufficientBalance)?;

            // Effects first
            if favor_buyer {
                order.status = OrderStatus::Cancelled;
                self.orders.insert(order_id, &order);

                // Refund based on order type
                match order.order_type {
                    OrderType::Sell => {
                        // Refund to buyer (original user)
                        if self.env().transfer(order.buyer, order.amount).is_err() {
                            return Err(Error::TransferFailed);
                        }
                    }
                    OrderType::Buy => {
                        // Refund to seller (LP who deposited)
                        if self.env().transfer(seller, order.amount).is_err() {
                            return Err(Error::TransferFailed);
                        }
                    }
                }
            } else {
                order.status = OrderStatus::Completed;
                self.orders.insert(order_id, &order);

                // Pay based on order type
                match order.order_type {
                    OrderType::Sell => {
                        // Pay LP
                        if self.env().transfer(seller, lp_payment).is_err() {
                            return Err(Error::TransferFailed);
                        }
                    }
                    OrderType::Buy => {
                        // Pay buyer
                        if self.env().transfer(order.buyer, lp_payment).is_err() {
                            return Err(Error::TransferFailed);
                        }
                    }
                }

                // Fee to owner
                if self.env().transfer(self.owner, order.lp_fee).is_err() {
                    return Err(Error::TransferFailed);
                }
            }

            self.env().emit_event(DisputeResolved {
                order_id,
                favor_buyer,
            });

            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_new_works() {
            let contract = PolkaPayEscrow::new(200);
            assert_eq!(contract.lp_fee_bps, 200);
            assert_eq!(contract.next_order_id, 1);
        }

        #[ink::test]
        fn test_new_with_different_fees() {
            let contract1 = PolkaPayEscrow::new(100);
            assert_eq!(contract1.lp_fee_bps, 100);

            let contract2 = PolkaPayEscrow::new(500);
            assert_eq!(contract2.lp_fee_bps, 500);
        }

        #[ink::test]
        fn test_create_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Set test balance
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            
            let result = contract.create_order(OrderType::Sell);
            assert!(result.is_ok());
            
            let order_id = result.unwrap();
            assert_eq!(order_id, 1);
            
            // Verify order was created
            let order = contract.get_order(order_id);
            assert!(order.is_some());
            
            let order = order.unwrap();
            assert_eq!(order.amount, 1000);
            assert_eq!(order.lp_fee, 20); // 2% of 1000
            assert_eq!(order.status, OrderStatus::Pending);
        }

        #[ink::test]
        fn test_create_order_with_zero_amount_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Set zero balance
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(0);
            
            let result = contract.create_order(OrderType::Sell);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InsufficientBalance);
        }

        #[ink::test]
        fn test_accept_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create order first
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Change caller to LP
            let lp_account = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().bob;
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(lp_account);
            
            // Accept order
            let result = contract.accept_order(order_id);
            assert!(result.is_ok());
            
            // Verify order was accepted
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Accepted);
            assert_eq!(order.seller, Some(lp_account));
        }

        #[ink::test]
        fn test_accept_order_already_accepted_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create and accept order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            let lp_account = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().bob;
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(lp_account);
            contract.accept_order(order_id).unwrap();
            
            // Try to accept again
            let result = contract.accept_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidStatus);
        }

        #[ink::test]
        fn test_accept_order_not_found_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            
            let result = contract.accept_order(999);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::OrderNotFound);
        }

        #[ink::test]
        fn test_confirm_payment_sent_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Accept order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            // Confirm payment sent by buyer
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            let result = contract.confirm_payment_sent(order_id);
            assert!(result.is_ok());
            
            // Verify status
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::PaymentSent);
        }

        #[ink::test]
        fn test_confirm_payment_sent_unauthorized_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and accept order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            // Try to confirm payment from wrong account
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.charlie);
            let result = contract.confirm_payment_sent(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }

        #[ink::test]
        fn test_confirm_payment_sent_wrong_status_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create order but don't accept
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Try to confirm payment when still pending
            let result = contract.confirm_payment_sent(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidStatus);
        }

        #[ink::test]
        fn test_complete_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Accept order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            // Confirm payment
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            
            // Complete order
            let result = contract.complete_order(order_id);
            assert!(result.is_ok());
            
            // Verify status
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Completed);
        }

        #[ink::test]
        fn test_complete_order_wrong_status_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Try to complete without payment sent (should fail with Unauthorized since caller is buyer)
            let result = contract.complete_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }

        #[ink::test]
        fn test_cancel_order_pending_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Cancel order
            let result = contract.cancel_order(order_id);
            assert!(result.is_ok());
            
            // Verify status
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Cancelled);
        }

        #[ink::test]
        fn test_cancel_order_accepted_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Accept order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            // Try to cancel accepted order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            let result = contract.cancel_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidStatus);
        }

        #[ink::test]
        fn test_cancel_order_unauthorized_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Try to cancel from different account
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let result = contract.cancel_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }

        #[ink::test]
        fn test_get_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Get order
            let order = contract.get_order(order_id);
            assert!(order.is_some());
            
            let order = order.unwrap();
            assert_eq!(order.id, order_id);
            assert_eq!(order.amount, 1000);
        }

        #[ink::test]
        fn test_get_order_not_found() {
            let contract = PolkaPayEscrow::new(200);
            
            let order = contract.get_order(999);
            assert!(order.is_none());
        }

        #[ink::test]
        fn test_get_balance_works() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create order to add balance
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            contract.create_order(OrderType::Sell).unwrap();
            
            // Check balance
            let balance = contract.get_balance();
            assert!(balance > 0);
        }

        #[ink::test]
        fn test_lp_fee_calculation() {
            let mut contract = PolkaPayEscrow::new(200); // 2%
            
            // Create order with 10000
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(10000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.lp_fee, 200); // 2% of 10000
            assert_eq!(order.amount, 10000);
        }

        #[ink::test]
        fn test_multiple_orders() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create first order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id1 = contract.create_order(OrderType::Sell).unwrap();
            assert_eq!(order_id1, 1);
            
            // Create second order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(2000);
            let order_id2 = contract.create_order(OrderType::Sell).unwrap();
            assert_eq!(order_id2, 2);
            
            // Verify both orders exist
            assert!(contract.get_order(order_id1).is_some());
            assert!(contract.get_order(order_id2).is_some());
            
            let order1 = contract.get_order(order_id1).unwrap();
            let order2 = contract.get_order(order_id2).unwrap();
            assert_eq!(order1.amount, 1000);
            assert_eq!(order2.amount, 2000);
        }

        // ========== SECURITY TESTS ==========

        #[ink::test]
        fn test_complete_order_unauthorized_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and accept order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            
            // Try to complete from unauthorized account
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.charlie);
            let result = contract.complete_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }

        #[ink::test]
        fn test_pause_unpause_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Owner can pause
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            assert!(!contract.is_paused());
            
            contract.pause().unwrap();
            assert!(contract.is_paused());
            
            contract.unpause().unwrap();
            assert!(!contract.is_paused());
        }

        #[ink::test]
        fn test_pause_blocks_operations() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Pause contract
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.pause().unwrap();
            
            // Try to create order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let result = contract.create_order(OrderType::Sell);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::ContractPaused);
        }

        #[ink::test]
        fn test_non_owner_cannot_pause() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Non-owner tries to pause
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let result = contract.pause();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }

        // ========== BUY ORDER TESTS ==========

        #[ink::test]
        fn test_create_buy_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            // Buy order should NOT send DOT
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(0);
            
            let order_id = contract.create_order(OrderType::Buy).unwrap();
            assert_eq!(order_id, 1);
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.order_type, OrderType::Buy);
            assert_eq!(order.amount, 0); // No amount yet
            assert_eq!(order.status, OrderStatus::Pending);
        }

        #[ink::test]
        fn test_create_buy_order_with_deposit_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Buy order WITH deposit should fail
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let result = contract.create_order(OrderType::Buy);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidAmount);
        }

        #[ink::test]
        fn test_accept_buy_order_with_deposit() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // User creates buy order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(0);
            let order_id = contract.create_order(OrderType::Buy).unwrap();
            
            // LP accepts and deposits DOT
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            contract.accept_buy_order(order_id).unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.seller, Some(accounts.bob));
            assert_eq!(order.amount, 1000);
            assert_eq!(order.lp_fee, 20); // 2% of 1000
            assert_eq!(order.status, OrderStatus::Accepted);
        }

        #[ink::test]
        fn test_accept_buy_order_on_sell_order_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create SELL order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Try to accept as buy order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let result = contract.accept_buy_order(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidOrderType);
        }

        #[ink::test]
        fn test_complete_buy_order_transfers_to_buyer() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create buy order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(0);
            let order_id = contract.create_order(OrderType::Buy).unwrap();
            
            // LP accepts with deposit
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            contract.accept_buy_order(order_id).unwrap();
            
            // User confirms payment
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            
            // Complete order - should transfer to buyer (alice)
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let result = contract.complete_order(order_id);
            assert!(result.is_ok());
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Completed);
        }

        // ========== DISPUTE TESTS ==========

        #[ink::test]
        fn test_create_dispute_works() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and process order to PaymentSent
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            
            // Create dispute
            contract.create_dispute(order_id).unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Disputed);
        }

        #[ink::test]
        fn test_create_dispute_wrong_status_fails() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create order but don't progress to PaymentSent
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            // Try to create dispute in Pending status
            let result = contract.create_dispute(order_id);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InvalidStatus);
        }

        #[ink::test]
        fn test_resolve_dispute_favor_buyer() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and dispute order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            contract.create_dispute(order_id).unwrap();
            
            // Owner resolves in favor of buyer
            contract.resolve_dispute(order_id, true).unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Cancelled);
        }

        #[ink::test]
        fn test_resolve_dispute_favor_seller() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and dispute order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            contract.create_dispute(order_id).unwrap();
            
            // Owner resolves in favor of seller
            contract.resolve_dispute(order_id, false).unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.status, OrderStatus::Completed);
        }

        #[ink::test]
        fn test_non_owner_cannot_resolve_dispute() {
            let mut contract = PolkaPayEscrow::new(200);
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Create and dispute order
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order(OrderType::Sell).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            contract.accept_order(order_id).unwrap();
            
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.alice);
            contract.confirm_payment_sent(order_id).unwrap();
            contract.create_dispute(order_id).unwrap();
            
            // Non-owner tries to resolve
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(accounts.bob);
            let result = contract.resolve_dispute(order_id, true);
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::Unauthorized);
        }
    }
}


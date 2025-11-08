#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polkapay_escrow {
    use ink::storage::Mapping;

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

    /// Errors
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[derive(Debug, PartialEq, Eq)]
    pub enum Error {
        OrderNotFound,
        Unauthorized,
        InvalidStatus,
        InsufficientBalance,
        TransferFailed,
    }

    impl PolkaPayEscrow {
        /// Constructor
        #[ink(constructor)]
        pub fn new(lp_fee_bps: u16) -> Self {
            Self {
                owner: Self::env().caller(),
                next_order_id: 1,
                orders: Mapping::default(),
                lp_fee_bps,
            }
        }

        /// Create a new order (buyer locks DOT)
        #[ink(message, payable)]
        pub fn create_order(&mut self) -> Result<u64, Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            if amount == 0 {
                return Err(Error::InsufficientBalance);
            }

            let order_id = self.next_order_id;
            let lp_fee = (amount * self.lp_fee_bps as u128) / 10000;

            let order = Order {
                id: order_id,
                buyer: caller,
                seller: None,
                amount,
                lp_fee,
                status: OrderStatus::Pending,
                created_at: self.env().block_timestamp(),
            };

            self.orders.insert(order_id, &order);
            self.next_order_id += 1;

            self.env().emit_event(OrderCreated {
                order_id,
                buyer: caller,
                amount,
            });

            Ok(order_id)
        }

        /// LP accepts order
        #[ink(message)]
        pub fn accept_order(&mut self, order_id: u64) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

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

        /// Mark payment as sent
        #[ink(message)]
        pub fn confirm_payment_sent(&mut self, order_id: u64) -> Result<(), Error> {
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
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;
            let seller = order.seller.ok_or(Error::Unauthorized)?;

            if order.status != OrderStatus::PaymentSent {
                return Err(Error::InvalidStatus);
            }

            // Calculate amounts
            let lp_payment = order.amount - order.lp_fee;

            // Transfer to LP
            if self.env().transfer(seller, lp_payment).is_err() {
                return Err(Error::TransferFailed);
            }

            // Transfer fee to owner (could be treasury)
            if self.env().transfer(self.owner, order.lp_fee).is_err() {
                return Err(Error::TransferFailed);
            }

            order.status = OrderStatus::Completed;
            self.orders.insert(order_id, &order);

            self.env().emit_event(OrderCompleted { order_id });

            Ok(())
        }

        /// Cancel order and refund (only if not accepted yet)
        #[ink(message)]
        pub fn cancel_order(&mut self, order_id: u64) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut order = self.orders.get(order_id).ok_or(Error::OrderNotFound)?;

            if order.buyer != caller {
                return Err(Error::Unauthorized);
            }

            if order.status != OrderStatus::Pending {
                return Err(Error::InvalidStatus);
            }

            // Refund buyer
            if self.env().transfer(order.buyer, order.amount).is_err() {
                return Err(Error::TransferFailed);
            }

            order.status = OrderStatus::Cancelled;
            self.orders.insert(order_id, &order);

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
            
            let result = contract.create_order();
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
            
            let result = contract.create_order();
            assert!(result.is_err());
            assert_eq!(result.unwrap_err(), Error::InsufficientBalance);
        }

        #[ink::test]
        fn test_accept_order_works() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create order first
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            let order_id = contract.create_order().unwrap();
            
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
            contract.create_order().unwrap();
            
            // Check balance
            let balance = contract.get_balance();
            assert!(balance > 0);
        }

        #[ink::test]
        fn test_lp_fee_calculation() {
            let mut contract = PolkaPayEscrow::new(200); // 2%
            
            // Create order with 10000
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(10000);
            let order_id = contract.create_order().unwrap();
            
            let order = contract.get_order(order_id).unwrap();
            assert_eq!(order.lp_fee, 200); // 2% of 10000
            assert_eq!(order.amount, 10000);
        }

        #[ink::test]
        fn test_multiple_orders() {
            let mut contract = PolkaPayEscrow::new(200);
            
            // Create first order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let order_id1 = contract.create_order().unwrap();
            assert_eq!(order_id1, 1);
            
            // Create second order
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(2000);
            let order_id2 = contract.create_order().unwrap();
            assert_eq!(order_id2, 2);
            
            // Verify both orders exist
            assert!(contract.get_order(order_id1).is_some());
            assert!(contract.get_order(order_id2).is_some());
            
            let order1 = contract.get_order(order_id1).unwrap();
            let order2 = contract.get_order(order_id2).unwrap();
            assert_eq!(order1.amount, 1000);
            assert_eq!(order2.amount, 2000);
        }
    }
}


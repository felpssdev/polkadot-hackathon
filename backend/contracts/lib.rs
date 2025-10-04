#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod polkapay_escrow {
    use ink::storage::Mapping;

    /// Order status
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum OrderStatus {
        Pending,
        Accepted,
        PaymentSent,
        Completed,
        Disputed,
        Cancelled,
    }

    /// Order structure
    #[derive(scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
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
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
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
}


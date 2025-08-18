import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type CoinInfo = { nonce: Uint8Array; color: Uint8Array; value: bigint };

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  create_account(context: __compactRuntime.CircuitContext<T>,
                 user_id_0: Uint8Array,
                 initial_pin_0: Uint8Array,
                 deposit_amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  deposit(context: __compactRuntime.CircuitContext<T>,
          user_id_0: Uint8Array,
          pin_0: Uint8Array,
          amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw(context: __compactRuntime.CircuitContext<T>,
           user_id_0: Uint8Array,
           pin_0: Uint8Array,
           amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  request_transfer_authorization(context: __compactRuntime.CircuitContext<T>,
                                 user_id_0: Uint8Array,
                                 recipient_id_0: Uint8Array,
                                 pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  grant_disclosure_permission(context: __compactRuntime.CircuitContext<T>,
                              user_id_0: Uint8Array,
                              requester_id_0: Uint8Array,
                              pin_0: Uint8Array,
                              permission_type_0: bigint,
                              threshold_amount_0: bigint,
                              expires_in_seconds_0: bigint): __compactRuntime.CircuitResults<T, []>;
  approve_transfer_authorization(context: __compactRuntime.CircuitContext<T>,
                                 user_id_0: Uint8Array,
                                 sender_id_0: Uint8Array,
                                 pin_0: Uint8Array,
                                 max_amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  send_to_authorized_user(context: __compactRuntime.CircuitContext<T>,
                          user_id_0: Uint8Array,
                          recipient_id_0: Uint8Array,
                          amount_0: bigint,
                          pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  claim_authorized_transfer(context: __compactRuntime.CircuitContext<T>,
                            user_id_0: Uint8Array,
                            sender_id_0: Uint8Array,
                            pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  get_token_balance(context: __compactRuntime.CircuitContext<T>,
                    user_id_0: Uint8Array,
                    pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  set_timestamp(context: __compactRuntime.CircuitContext<T>, timestamp_0: bigint): __compactRuntime.CircuitResults<T, []>;
  verify_account_status(context: __compactRuntime.CircuitContext<T>,
                        user_id_0: Uint8Array,
                        pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
  public_key(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<T> = {
  create_account(context: __compactRuntime.CircuitContext<T>,
                 user_id_0: Uint8Array,
                 initial_pin_0: Uint8Array,
                 deposit_amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  deposit(context: __compactRuntime.CircuitContext<T>,
          user_id_0: Uint8Array,
          pin_0: Uint8Array,
          amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw(context: __compactRuntime.CircuitContext<T>,
           user_id_0: Uint8Array,
           pin_0: Uint8Array,
           amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  request_transfer_authorization(context: __compactRuntime.CircuitContext<T>,
                                 user_id_0: Uint8Array,
                                 recipient_id_0: Uint8Array,
                                 pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  grant_disclosure_permission(context: __compactRuntime.CircuitContext<T>,
                              user_id_0: Uint8Array,
                              requester_id_0: Uint8Array,
                              pin_0: Uint8Array,
                              permission_type_0: bigint,
                              threshold_amount_0: bigint,
                              expires_in_seconds_0: bigint): __compactRuntime.CircuitResults<T, []>;
  approve_transfer_authorization(context: __compactRuntime.CircuitContext<T>,
                                 user_id_0: Uint8Array,
                                 sender_id_0: Uint8Array,
                                 pin_0: Uint8Array,
                                 max_amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  send_to_authorized_user(context: __compactRuntime.CircuitContext<T>,
                          user_id_0: Uint8Array,
                          recipient_id_0: Uint8Array,
                          amount_0: bigint,
                          pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  claim_authorized_transfer(context: __compactRuntime.CircuitContext<T>,
                            user_id_0: Uint8Array,
                            sender_id_0: Uint8Array,
                            pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  get_token_balance(context: __compactRuntime.CircuitContext<T>,
                    user_id_0: Uint8Array,
                    pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  set_timestamp(context: __compactRuntime.CircuitContext<T>, timestamp_0: bigint): __compactRuntime.CircuitResults<T, []>;
  verify_account_status(context: __compactRuntime.CircuitContext<T>,
                        user_id_0: Uint8Array,
                        pin_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  public_key(context: __compactRuntime.CircuitContext<T>, sk_0: Uint8Array): __compactRuntime.CircuitResults<T, Uint8Array>;
}

export type Ledger = {
  all_accounts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { exists: boolean,
                                 owner_hash: Uint8Array,
                                 public_key: { bytes: Uint8Array },
                                 transaction_count: bigint,
                                 last_transaction: Uint8Array,
                                 status: Uint8Array,
                                 created_at: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { exists: boolean,
  owner_hash: Uint8Array,
  public_key: { bytes: Uint8Array },
  transaction_count: bigint,
  last_transaction: Uint8Array,
  status: Uint8Array,
  created_at: bigint
}]>
  };
  readonly total_accounts: bigint;
  readonly last_global_transaction: Uint8Array;
  active_authorizations: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { sender_id: Uint8Array,
                                 recipient_id: Uint8Array,
                                 shared_encryption_key: Uint8Array,
                                 max_amount: bigint,
                                 created_at: bigint,
                                 last_updated: bigint,
                                 permission_type: bigint,
                                 expires_at: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { sender_id: Uint8Array,
  recipient_id: Uint8Array,
  shared_encryption_key: Uint8Array,
  max_amount: bigint,
  created_at: bigint,
  last_updated: bigint,
  permission_type: bigint,
  expires_at: bigint
}]>
  };
  encrypted_balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  pending_auth_requests: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): { sender_id: Uint8Array,
                                 recipient_id: Uint8Array,
                                 requested_at: bigint,
                                 status: bigint
                               };
    [Symbol.iterator](): Iterator<[Uint8Array, { sender_id: Uint8Array,
  recipient_id: Uint8Array,
  requested_at: bigint,
  status: bigint
}]>
  };
  user_as_recipient_auths: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array[];
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array[]]>
  };
  user_as_sender_auths: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array[];
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array[]]>
  };
  encrypted_amount_mappings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly bank_token_id: Uint8Array;
  encrypted_user_balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  user_balance_mappings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  shared_balance_access: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  readonly total_token_supply: bigint;
  readonly token_mint_authority: Uint8Array;
  readonly current_timestamp: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;

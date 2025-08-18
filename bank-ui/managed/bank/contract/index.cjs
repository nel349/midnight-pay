'use strict';
const __compactRuntime = require('@midnight-ntwrk/compact-runtime');
const expectedRuntimeVersionString = '0.8.1';
const expectedRuntimeVersion = expectedRuntimeVersionString.split('-')[0].split('.').map(Number);
const actualRuntimeVersion = __compactRuntime.versionString.split('-')[0].split('.').map(Number);
if (expectedRuntimeVersion[0] != actualRuntimeVersion[0]
     || (actualRuntimeVersion[0] == 0 && expectedRuntimeVersion[1] != actualRuntimeVersion[1])
     || expectedRuntimeVersion[1] > actualRuntimeVersion[1]
     || (expectedRuntimeVersion[1] == actualRuntimeVersion[1] && expectedRuntimeVersion[2] > actualRuntimeVersion[2]))
   throw new __compactRuntime.CompactError(`Version mismatch: compiled code expects ${expectedRuntimeVersionString}, runtime is ${__compactRuntime.versionString}`);
{ const MAX_FIELD = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
  if (__compactRuntime.MAX_FIELD !== MAX_FIELD)
     throw new __compactRuntime.CompactError(`compiler thinks maximum field value is ${MAX_FIELD}; run time thinks it is ${__compactRuntime.MAX_FIELD}`)
}

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = new __compactRuntime.CompactTypeBoolean();

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_4 = new _ZswapCoinPublicKey_0();

class _BankAccount_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_1.alignment().concat(_descriptor_4.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment()))))));
  }
  fromValue(value_0) {
    return {
      exists: _descriptor_2.fromValue(value_0),
      owner_hash: _descriptor_1.fromValue(value_0),
      public_key: _descriptor_4.fromValue(value_0),
      transaction_count: _descriptor_3.fromValue(value_0),
      last_transaction: _descriptor_1.fromValue(value_0),
      status: _descriptor_1.fromValue(value_0),
      created_at: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.exists).concat(_descriptor_1.toValue(value_0.owner_hash).concat(_descriptor_4.toValue(value_0.public_key).concat(_descriptor_3.toValue(value_0.transaction_count).concat(_descriptor_1.toValue(value_0.last_transaction).concat(_descriptor_1.toValue(value_0.status).concat(_descriptor_3.toValue(value_0.created_at)))))));
  }
}

const _descriptor_5 = new _BankAccount_0();

const _descriptor_6 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class _TransferAuthorization_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_6.alignment().concat(_descriptor_3.alignment())))))));
  }
  fromValue(value_0) {
    return {
      sender_id: _descriptor_1.fromValue(value_0),
      recipient_id: _descriptor_1.fromValue(value_0),
      shared_encryption_key: _descriptor_1.fromValue(value_0),
      max_amount: _descriptor_0.fromValue(value_0),
      created_at: _descriptor_3.fromValue(value_0),
      last_updated: _descriptor_3.fromValue(value_0),
      permission_type: _descriptor_6.fromValue(value_0),
      expires_at: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.sender_id).concat(_descriptor_1.toValue(value_0.recipient_id).concat(_descriptor_1.toValue(value_0.shared_encryption_key).concat(_descriptor_0.toValue(value_0.max_amount).concat(_descriptor_3.toValue(value_0.created_at).concat(_descriptor_3.toValue(value_0.last_updated).concat(_descriptor_6.toValue(value_0.permission_type).concat(_descriptor_3.toValue(value_0.expires_at))))))));
  }
}

const _descriptor_7 = new _TransferAuthorization_0();

class _AuthRequest_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_6.alignment())));
  }
  fromValue(value_0) {
    return {
      sender_id: _descriptor_1.fromValue(value_0),
      recipient_id: _descriptor_1.fromValue(value_0),
      requested_at: _descriptor_3.fromValue(value_0),
      status: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.sender_id).concat(_descriptor_1.toValue(value_0.recipient_id).concat(_descriptor_3.toValue(value_0.requested_at).concat(_descriptor_6.toValue(value_0.status))));
  }
}

const _descriptor_8 = new _AuthRequest_0();

const _descriptor_9 = new __compactRuntime.CompactTypeVector(20, _descriptor_1);

const _descriptor_10 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_11 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

const _descriptor_12 = new __compactRuntime.CompactTypeVector(3, _descriptor_1);

const _descriptor_13 = new __compactRuntime.CompactTypeVector(4, _descriptor_1);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_14 = new _ContractAddress_0();

class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    this.witnesses = witnesses_0;
    this.circuits = {
      create_account: (...args_1) => {
        if (args_1.length !== 4)
          throw new __compactRuntime.CompactError(`create_account: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const initial_pin_0 = args_1[2];
        const deposit_amount_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('create_account',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 99 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('create_account',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 99 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(initial_pin_0.buffer instanceof ArrayBuffer && initial_pin_0.BYTES_PER_ELEMENT === 1 && initial_pin_0.length === 32))
          __compactRuntime.type_error('create_account',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 99 char 1',
                                      'Bytes<32>',
                                      initial_pin_0)
        if (!(typeof(deposit_amount_0) === 'bigint' && deposit_amount_0 >= 0 && deposit_amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('create_account',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 99 char 1',
                                      'Uint<0..18446744073709551615>',
                                      deposit_amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(initial_pin_0).concat(_descriptor_0.toValue(deposit_amount_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_create_account_0(context,
                                                 partialProofData,
                                                 user_id_0,
                                                 initial_pin_0,
                                                 deposit_amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      deposit: (...args_1) => {
        if (args_1.length !== 4)
          throw new __compactRuntime.CompactError(`deposit: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const pin_0 = args_1[2];
        const amount_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('deposit',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 130 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('deposit',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 130 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('deposit',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 130 char 1',
                                      'Bytes<32>',
                                      pin_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('deposit',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 130 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(pin_0).concat(_descriptor_0.toValue(amount_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_deposit_0(context,
                                          partialProofData,
                                          user_id_0,
                                          pin_0,
                                          amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      withdraw: (...args_1) => {
        if (args_1.length !== 4)
          throw new __compactRuntime.CompactError(`withdraw: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const pin_0 = args_1[2];
        const amount_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('withdraw',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 159 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('withdraw',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 159 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('withdraw',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 159 char 1',
                                      'Bytes<32>',
                                      pin_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('withdraw',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 159 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(pin_0).concat(_descriptor_0.toValue(amount_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_withdraw_0(context,
                                           partialProofData,
                                           user_id_0,
                                           pin_0,
                                           amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      request_transfer_authorization: (...args_1) => {
        if (args_1.length !== 4)
          throw new __compactRuntime.CompactError(`request_transfer_authorization: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const recipient_id_0 = args_1[2];
        const pin_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('request_transfer_authorization',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 192 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('request_transfer_authorization',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 192 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(recipient_id_0.buffer instanceof ArrayBuffer && recipient_id_0.BYTES_PER_ELEMENT === 1 && recipient_id_0.length === 32))
          __compactRuntime.type_error('request_transfer_authorization',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 192 char 1',
                                      'Bytes<32>',
                                      recipient_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('request_transfer_authorization',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 192 char 1',
                                      'Bytes<32>',
                                      pin_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(recipient_id_0).concat(_descriptor_1.toValue(pin_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_request_transfer_authorization_0(context,
                                                                 partialProofData,
                                                                 user_id_0,
                                                                 recipient_id_0,
                                                                 pin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      grant_disclosure_permission: (...args_1) => {
        if (args_1.length !== 7)
          throw new __compactRuntime.CompactError(`grant_disclosure_permission: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const requester_id_0 = args_1[2];
        const pin_0 = args_1[3];
        const permission_type_0 = args_1[4];
        const threshold_amount_0 = args_1[5];
        const expires_in_seconds_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(requester_id_0.buffer instanceof ArrayBuffer && requester_id_0.BYTES_PER_ELEMENT === 1 && requester_id_0.length === 32))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Bytes<32>',
                                      requester_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Bytes<32>',
                                      pin_0)
        if (!(typeof(permission_type_0) === 'bigint' && permission_type_0 >= 0 && permission_type_0 <= 255n))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 4 (argument 5 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Uint<0..255>',
                                      permission_type_0)
        if (!(typeof(threshold_amount_0) === 'bigint' && threshold_amount_0 >= 0 && threshold_amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 5 (argument 6 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Uint<0..18446744073709551615>',
                                      threshold_amount_0)
        if (!(typeof(expires_in_seconds_0) === 'bigint' && expires_in_seconds_0 >= 0 && expires_in_seconds_0 <= 4294967295n))
          __compactRuntime.type_error('grant_disclosure_permission',
                                      'argument 6 (argument 7 as invoked from Typescript)',
                                      'bank.compact line 226 char 1',
                                      'Uint<0..4294967295>',
                                      expires_in_seconds_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(requester_id_0).concat(_descriptor_1.toValue(pin_0).concat(_descriptor_6.toValue(permission_type_0).concat(_descriptor_0.toValue(threshold_amount_0).concat(_descriptor_3.toValue(expires_in_seconds_0)))))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_grant_disclosure_permission_0(context,
                                                              partialProofData,
                                                              user_id_0,
                                                              requester_id_0,
                                                              pin_0,
                                                              permission_type_0,
                                                              threshold_amount_0,
                                                              expires_in_seconds_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      approve_transfer_authorization: (...args_1) => {
        if (args_1.length !== 5)
          throw new __compactRuntime.CompactError(`approve_transfer_authorization: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const sender_id_0 = args_1[2];
        const pin_0 = args_1[3];
        const max_amount_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('approve_transfer_authorization',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 303 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('approve_transfer_authorization',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 303 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(sender_id_0.buffer instanceof ArrayBuffer && sender_id_0.BYTES_PER_ELEMENT === 1 && sender_id_0.length === 32))
          __compactRuntime.type_error('approve_transfer_authorization',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 303 char 1',
                                      'Bytes<32>',
                                      sender_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('approve_transfer_authorization',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 303 char 1',
                                      'Bytes<32>',
                                      pin_0)
        if (!(typeof(max_amount_0) === 'bigint' && max_amount_0 >= 0 && max_amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('approve_transfer_authorization',
                                      'argument 4 (argument 5 as invoked from Typescript)',
                                      'bank.compact line 303 char 1',
                                      'Uint<0..18446744073709551615>',
                                      max_amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(sender_id_0).concat(_descriptor_1.toValue(pin_0).concat(_descriptor_0.toValue(max_amount_0)))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_approve_transfer_authorization_0(context,
                                                                 partialProofData,
                                                                 user_id_0,
                                                                 sender_id_0,
                                                                 pin_0,
                                                                 max_amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      send_to_authorized_user: (...args_1) => {
        if (args_1.length !== 5)
          throw new __compactRuntime.CompactError(`send_to_authorized_user: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const recipient_id_0 = args_1[2];
        const amount_0 = args_1[3];
        const pin_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('send_to_authorized_user',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 375 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('send_to_authorized_user',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 375 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(recipient_id_0.buffer instanceof ArrayBuffer && recipient_id_0.BYTES_PER_ELEMENT === 1 && recipient_id_0.length === 32))
          __compactRuntime.type_error('send_to_authorized_user',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 375 char 1',
                                      'Bytes<32>',
                                      recipient_id_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('send_to_authorized_user',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 375 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('send_to_authorized_user',
                                      'argument 4 (argument 5 as invoked from Typescript)',
                                      'bank.compact line 375 char 1',
                                      'Bytes<32>',
                                      pin_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(recipient_id_0).concat(_descriptor_0.toValue(amount_0).concat(_descriptor_1.toValue(pin_0)))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_1.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_send_to_authorized_user_0(context,
                                                          partialProofData,
                                                          user_id_0,
                                                          recipient_id_0,
                                                          amount_0,
                                                          pin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      claim_authorized_transfer: (...args_1) => {
        if (args_1.length !== 4)
          throw new __compactRuntime.CompactError(`claim_authorized_transfer: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const sender_id_0 = args_1[2];
        const pin_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('claim_authorized_transfer',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 450 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('claim_authorized_transfer',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 450 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(sender_id_0.buffer instanceof ArrayBuffer && sender_id_0.BYTES_PER_ELEMENT === 1 && sender_id_0.length === 32))
          __compactRuntime.type_error('claim_authorized_transfer',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 450 char 1',
                                      'Bytes<32>',
                                      sender_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('claim_authorized_transfer',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'bank.compact line 450 char 1',
                                      'Bytes<32>',
                                      pin_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(sender_id_0).concat(_descriptor_1.toValue(pin_0))),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_claim_authorized_transfer_0(context,
                                                            partialProofData,
                                                            user_id_0,
                                                            sender_id_0,
                                                            pin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      get_token_balance: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`get_token_balance: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const pin_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('get_token_balance',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 517 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('get_token_balance',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 517 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('get_token_balance',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 517 char 1',
                                      'Bytes<32>',
                                      pin_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(pin_0)),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_get_token_balance_0(context,
                                                    partialProofData,
                                                    user_id_0,
                                                    pin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      set_timestamp: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`set_timestamp: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const timestamp_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('set_timestamp',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 546 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(typeof(timestamp_0) === 'bigint' && timestamp_0 >= 0 && timestamp_0 <= 4294967295n))
          __compactRuntime.type_error('set_timestamp',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 546 char 1',
                                      'Uint<0..4294967295>',
                                      timestamp_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(timestamp_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_set_timestamp_0(context,
                                                partialProofData,
                                                timestamp_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      verify_account_status: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`verify_account_status: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const user_id_0 = args_1[1];
        const pin_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('verify_account_status',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 553 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(user_id_0.buffer instanceof ArrayBuffer && user_id_0.BYTES_PER_ELEMENT === 1 && user_id_0.length === 32))
          __compactRuntime.type_error('verify_account_status',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 553 char 1',
                                      'Bytes<32>',
                                      user_id_0)
        if (!(pin_0.buffer instanceof ArrayBuffer && pin_0.BYTES_PER_ELEMENT === 1 && pin_0.length === 32))
          __compactRuntime.type_error('verify_account_status',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'bank.compact line 553 char 1',
                                      'Bytes<32>',
                                      pin_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(user_id_0).concat(_descriptor_1.toValue(pin_0)),
            alignment: _descriptor_1.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_verify_account_status_0(context,
                                                        partialProofData,
                                                        user_id_0,
                                                        pin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      public_key: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`public_key: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const sk_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('public_key',
                                      'argument 1 (as invoked from Typescript)',
                                      'bank.compact line 589 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32))
          __compactRuntime.type_error('public_key',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'bank.compact line 589 char 1',
                                      'Bytes<32>',
                                      sk_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(sk_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_public_key_0(context, partialProofData, sk_0);
        partialProofData.output = { value: _descriptor_1.toValue(result_0), alignment: _descriptor_1.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      }
    };
    this.impureCircuits = {
      create_account: this.circuits.create_account,
      deposit: this.circuits.deposit,
      withdraw: this.circuits.withdraw,
      request_transfer_authorization: this.circuits.request_transfer_authorization,
      grant_disclosure_permission: this.circuits.grant_disclosure_permission,
      approve_transfer_authorization: this.circuits.approve_transfer_authorization,
      send_to_authorized_user: this.circuits.send_to_authorized_user,
      claim_authorized_transfer: this.circuits.claim_authorized_transfer,
      get_token_balance: this.circuits.get_token_balance,
      set_timestamp: this.circuits.set_timestamp,
      verify_account_status: this.circuits.verify_account_status
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    let stateValue_2 = __compactRuntime.StateValue.newArray();
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_2);
    let stateValue_1 = __compactRuntime.StateValue.newArray();
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_1);
    state_0.data = stateValue_0;
    state_0.setOperation('create_account', new __compactRuntime.ContractOperation());
    state_0.setOperation('deposit', new __compactRuntime.ContractOperation());
    state_0.setOperation('withdraw', new __compactRuntime.ContractOperation());
    state_0.setOperation('request_transfer_authorization', new __compactRuntime.ContractOperation());
    state_0.setOperation('grant_disclosure_permission', new __compactRuntime.ContractOperation());
    state_0.setOperation('approve_transfer_authorization', new __compactRuntime.ContractOperation());
    state_0.setOperation('send_to_authorized_user', new __compactRuntime.ContractOperation());
    state_0.setOperation('claim_authorized_transfer', new __compactRuntime.ContractOperation());
    state_0.setOperation('get_token_balance', new __compactRuntime.ContractOperation());
    state_0.setOperation('set_timestamp', new __compactRuntime.ContractOperation());
    state_0.setOperation('verify_account_status', new __compactRuntime.ContractOperation());
    const context = {
      originalState: state_0,
      currentPrivateState: constructorContext_0.initialPrivateState,
      currentZswapLocalState: constructorContext_0.initialZswapLocalState,
      transactionContext: new __compactRuntime.QueryContext(state_0.data, __compactRuntime.dummyContractAddress())
    };
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(0n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(2n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(3n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(4n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(5n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(6n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(7n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(8n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(9n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(10n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(11n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(12n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(13n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(14n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array([98, 97, 110, 107, 95, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_0 = this.#_persistentHash_2(context,
                                          partialProofData,
                                          new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 95, 98, 97, 110, 107, 95, 116, 111, 107, 101, 110, 95, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(8n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_1 = this.#_persistentHash_2(context,
                                          partialProofData,
                                          new Uint8Array([98, 97, 110, 107, 95, 99, 111, 110, 116, 114, 97, 99, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(13n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_2 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(12n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_2),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_3 = 1000000n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(14n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_3),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    state_0.data = context.transactionContext.state;
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  #_persistentHash_0(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_13, value_0);
    return result_0;
  }
  #_persistentHash_1(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_12, value_0);
    return result_0;
  }
  #_persistentHash_2(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_1, value_0);
    return result_0;
  }
  #_persistentHash_3(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_0, value_0);
    return result_0;
  }
  #_persistentHash_4(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  #_ownPublicKey_0(context, partialProofData) {
    const result_0 = __compactRuntime.ownPublicKey(context);
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_4.toValue(result_0),
      alignment: _descriptor_4.alignment()
    });
    return result_0;
  }
  #_create_account_0(context,
                     partialProofData,
                     user_id_0,
                     initial_pin_0,
                     deposit_amount_0)
  {
    __compactRuntime.assert(!_descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                             alignment: _descriptor_1.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value),
                            'Account already exists');
    __compactRuntime.assert(deposit_amount_0 >= 10n,
                            'Minimum deposit is 10 tokens');
    __compactRuntime.assert(this.#_valid_pin_format_0(context,
                                                      partialProofData,
                                                      initial_pin_0),
                            'PIN must be valid format');
    const owner_id_0 = this.#_public_key_0(context,
                                           partialProofData,
                                           initial_pin_0);
    const new_account_0 = { exists: true,
                            owner_hash: owner_id_0,
                            public_key:
                              this.#_ownPublicKey_0(context, partialProofData),
                            transaction_count: 1n,
                            last_transaction:
                              this.#_persistentHash_2(context,
                                                      partialProofData,
                                                      new Uint8Array([97, 99, 99, 111, 117, 110, 116, 95, 99, 114, 101, 97, 116, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                            status:
                              new Uint8Array([97, 99, 116, 105, 118, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            created_at: 1n };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(new_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_0 = 1n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_10.toValue(tmp_0),
                                              alignment: _descriptor_10.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_1 = this.#_persistentHash_4(context,
                                          partialProofData,
                                          [new Uint8Array([97, 99, 99, 111, 117, 110, 116, 95, 99, 114, 101, 97, 116, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           user_id_0]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    this.#_mint_bank_tokens_0(context,
                              partialProofData,
                              user_id_0,
                              deposit_amount_0,
                              initial_pin_0);
    return [];
  }
  #_deposit_0(context, partialProofData, user_id_0, pin_0, amount_0) {
    __compactRuntime.assert(amount_0 > 0n, 'Deposit amount must be positive');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    const expected_owner_0 = this.#_public_key_0(context,
                                                 partialProofData,
                                                 pin_0);
    __compactRuntime.assert(this.#_equal_0(account_0.owner_hash,
                                           expected_owner_0),
                            'Authentication failed');
    this.#_mint_bank_tokens_0(context,
                              partialProofData,
                              user_id_0,
                              amount_0,
                              pin_0);
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count:
                                  ((t1) => {
                                    if (t1 > 4294967295n)
                                      throw new __compactRuntime.CompactError('bank.compact line 148 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                    return t1;
                                  })(account_0.transaction_count + 1n),
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([116, 111, 107, 101, 110, 95, 100, 101, 112, 111, 115, 105, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status:
                                  new Uint8Array([97, 99, 116, 105, 118, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_0 = this.#_persistentHash_4(context,
                                          partialProofData,
                                          [new Uint8Array([116, 111, 107, 101, 110, 95, 100, 101, 112, 111, 115, 105, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           user_id_0]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_withdraw_0(context, partialProofData, user_id_0, pin_0, amount_0) {
    __compactRuntime.assert(amount_0 > 0n, 'Withdrawal amount must be positive');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    const expected_owner_0 = this.#_public_key_0(context,
                                                 partialProofData,
                                                 pin_0);
    __compactRuntime.assert(this.#_equal_1(account_0.owner_hash,
                                           expected_owner_0),
                            'Authentication failed');
    this.#_burn_bank_tokens_0(context,
                              partialProofData,
                              user_id_0,
                              amount_0,
                              pin_0);
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count:
                                  ((t1) => {
                                    if (t1 > 4294967295n)
                                      throw new __compactRuntime.CompactError('bank.compact line 181 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                    return t1;
                                  })(account_0.transaction_count + 1n),
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([116, 111, 107, 101, 110, 95, 119, 105, 116, 104, 100, 114, 97, 119, 97, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status: account_0.status,
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_0 = this.#_persistentHash_4(context,
                                          partialProofData,
                                          [new Uint8Array([116, 111, 107, 101, 110, 95, 119, 105, 116, 104, 100, 114, 97, 119, 97, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           user_id_0]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_request_transfer_authorization_0(context,
                                     partialProofData,
                                     user_id_0,
                                     recipient_id_0,
                                     pin_0)
  {
    __compactRuntime.assert(!this.#_equal_2(user_id_0, recipient_id_0),
                            'Cannot authorize yourself');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(recipient_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Recipient account does not exist');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Sender account does not exist');
    const sender_account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_3(sender_account_0.owner_hash,
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               pin_0)),
                            'Authentication failed');
    const request_id_0 = this.#_persistentHash_4(context,
                                                 partialProofData,
                                                 [user_id_0, recipient_id_0]);
    const request_0 = { sender_id: user_id_0,
                        recipient_id: recipient_id_0,
                        requested_at: 1n,
                        status: 0n };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(4n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(request_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(request_0),
                                                                            alignment: _descriptor_8.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const updated_sender_0 = { exists: sender_account_0.exists,
                               owner_hash: sender_account_0.owner_hash,
                               public_key: sender_account_0.public_key,
                               transaction_count:
                                 ((t1) => {
                                   if (t1 > 4294967295n)
                                     throw new __compactRuntime.CompactError('bank.compact line 217 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                   return t1;
                                 })(sender_account_0.transaction_count + 1n),
                               last_transaction:
                                 this.#_persistentHash_2(context,
                                                         partialProofData,
                                                         new Uint8Array([97, 117, 116, 104, 95, 114, 101, 113, 117, 101, 115, 116, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                               status: sender_account_0.status,
                               created_at: sender_account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_sender_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_grant_disclosure_permission_0(context,
                                  partialProofData,
                                  user_id_0,
                                  requester_id_0,
                                  pin_0,
                                  permission_type_0,
                                  threshold_amount_0,
                                  expires_in_seconds_0)
  {
    __compactRuntime.assert(!this.#_equal_4(user_id_0, requester_id_0),
                            'Cannot grant disclosure to yourself');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(requester_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Requester account does not exist');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_5(account_0.owner_hash,
                                           this.#_public_key_0(context,
                                                               partialProofData,
                                                               pin_0)),
                            'Authentication failed');
    __compactRuntime.assert(this.#_equal_6(permission_type_0, 1n)
                            ||
                            this.#_equal_7(permission_type_0, 2n),
                            'Invalid permission type (1=threshold, 2=exact)');
    const shared_key_0 = this.#_persistentHash_1(context,
                                                 partialProofData,
                                                 [user_id_0,
                                                  requester_id_0,
                                                  this.#_persistentHash_2(context,
                                                                          partialProofData,
                                                                          pin_0)]);
    const permission_type_pad_0 = this.#_equal_8(permission_type_0, 1n) ?
                                  new Uint8Array([116, 104, 114, 101, 115, 104, 111, 108, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
                                  :
                                  new Uint8Array([101, 120, 97, 99, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const disclosure_id_0 = this.#_persistentHash_0(context,
                                                    partialProofData,
                                                    [requester_id_0,
                                                     user_id_0,
                                                     new Uint8Array([100, 105, 115, 99, 108, 111, 115, 117, 114, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                     permission_type_pad_0]);
    const expires_seconds_0 = expires_in_seconds_0;
    const expires_at_0 = this.#_equal_9(expires_seconds_0, 0n) ?
                         0n :
                         ((t1) => {
                           if (t1 > 4294967295n)
                             throw new __compactRuntime.CompactError('bank.compact line 246 char 61: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                           return t1;
                         })(_descriptor_3.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(14n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            +
                            expires_seconds_0);
    const disclosure_permission_0 = { sender_id: requester_id_0,
                                      recipient_id: user_id_0,
                                      shared_encryption_key: shared_key_0,
                                      max_amount: threshold_amount_0,
                                      created_at: 1n,
                                      last_updated: 1n,
                                      permission_type: permission_type_0,
                                      expires_at: expires_at_0 };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(2n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(disclosure_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(disclosure_permission_0),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                pin_0]);
    const user_encrypted_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(9n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                             alignment: _descriptor_1.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value)
                             ?
                             _descriptor_1.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(9n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value)
                             :
                             this.#_encrypt_balance_0(context,
                                                      partialProofData,
                                                      0n,
                                                      user_key_0);
    const user_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_6.toValue(1n),
                                                                                               alignment: _descriptor_6.alignment() } },
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_6.toValue(10n),
                                                                                               alignment: _descriptor_6.alignment() } }] } },
                                                                    { push: { storage: false,
                                                                              value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_encrypted_0),
                                                                                                                           alignment: _descriptor_1.alignment() }).encode() } },
                                                                    'member',
                                                                    { popeq: { cached: true,
                                                                               result: undefined } }]).value)
                           ?
                           _descriptor_0.fromValue(Contract._query(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_6.toValue(1n),
                                                                                               alignment: _descriptor_6.alignment() } },
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_6.toValue(10n),
                                                                                               alignment: _descriptor_6.alignment() } }] } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_1.toValue(user_encrypted_0),
                                                                                               alignment: _descriptor_1.alignment() } }] } },
                                                                    { popeq: { cached: false,
                                                                               result: undefined } }]).value)
                           :
                           0n;
    const shared_balance_encrypted_0 = this.#_encrypt_balance_0(context,
                                                                partialProofData,
                                                                user_balance_0,
                                                                shared_key_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(shared_balance_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(user_balance_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(11n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(disclosure_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(shared_balance_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const empty_vector_0 = [new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])];
    const recipient_auths_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(5n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_9.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(5n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              empty_vector_0;
    const updated_recipient_auths_0 = [disclosure_id_0,
                                       recipient_auths_0[0],
                                       recipient_auths_0[1],
                                       recipient_auths_0[2],
                                       recipient_auths_0[3],
                                       recipient_auths_0[4],
                                       recipient_auths_0[5],
                                       recipient_auths_0[6],
                                       recipient_auths_0[7],
                                       recipient_auths_0[8],
                                       recipient_auths_0[9],
                                       recipient_auths_0[10],
                                       recipient_auths_0[11],
                                       recipient_auths_0[12],
                                       recipient_auths_0[13],
                                       recipient_auths_0[14],
                                       recipient_auths_0[15],
                                       recipient_auths_0[16],
                                       recipient_auths_0[17],
                                       recipient_auths_0[18]];
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(5n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(updated_recipient_auths_0),
                                                                            alignment: _descriptor_9.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count:
                                  ((t1) => {
                                    if (t1 > 4294967295n)
                                      throw new __compactRuntime.CompactError('bank.compact line 294 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                    return t1;
                                  })(account_0.transaction_count + 1n),
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([100, 105, 115, 99, 108, 111, 115, 117, 114, 101, 95, 103, 114, 97, 110, 116, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status: account_0.status,
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_approve_transfer_authorization_0(context,
                                     partialProofData,
                                     user_id_0,
                                     sender_id_0,
                                     pin_0,
                                     max_amount_0)
  {
    const request_id_0 = this.#_persistentHash_4(context,
                                                 partialProofData,
                                                 [sender_id_0, user_id_0]);
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(4n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(request_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'No pending authorization request');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_10(account_0.owner_hash,
                                            this.#_public_key_0(context,
                                                                partialProofData,
                                                                pin_0)),
                            'Authentication failed');
    const shared_key_0 = this.#_persistentHash_1(context,
                                                 partialProofData,
                                                 [user_id_0,
                                                  sender_id_0,
                                                  this.#_persistentHash_2(context,
                                                                          partialProofData,
                                                                          pin_0)]);
    const auth_id_0 = this.#_persistentHash_4(context,
                                              partialProofData,
                                              [sender_id_0, user_id_0]);
    const authorization_0 = { sender_id: sender_id_0,
                              recipient_id: user_id_0,
                              shared_encryption_key: shared_key_0,
                              max_amount: max_amount_0,
                              created_at: 1n,
                              last_updated: 1n,
                              permission_type: 0n,
                              expires_at: 0n };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(2n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(authorization_0),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const zero_amount_0 = 0n;
    const encrypted_zero_0 = this.#_encrypt_balance_0(context,
                                                      partialProofData,
                                                      zero_amount_0,
                                                      shared_key_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(3n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(encrypted_zero_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const sender_user_key_0 = this.#_persistentHash_4(context,
                                                      partialProofData,
                                                      [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                       pin_0]);
    const sender_encrypted_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                                   alignment: _descriptor_6.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                        { push: { storage: false,
                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(sender_id_0),
                                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                                        'member',
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value)
                               ?
                               _descriptor_1.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                                   alignment: _descriptor_6.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(sender_id_0),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value)
                               :
                               this.#_encrypt_balance_0(context,
                                                        partialProofData,
                                                        0n,
                                                        sender_user_key_0);
    const sender_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(10n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(sender_encrypted_0),
                                                                                                                             alignment: _descriptor_1.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value)
                             ?
                             _descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(10n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(sender_encrypted_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value)
                             :
                             0n;
    const shared_balance_encrypted_0 = this.#_encrypt_balance_0(context,
                                                                partialProofData,
                                                                sender_balance_0,
                                                                shared_key_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(11n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(shared_balance_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const empty_vector_0 = [new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])];
    const recipient_auths_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(5n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_9.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(5n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              empty_vector_0;
    const updated_recipient_auths_0 = [auth_id_0,
                                       recipient_auths_0[0],
                                       recipient_auths_0[1],
                                       recipient_auths_0[2],
                                       recipient_auths_0[3],
                                       recipient_auths_0[4],
                                       recipient_auths_0[5],
                                       recipient_auths_0[6],
                                       recipient_auths_0[7],
                                       recipient_auths_0[8],
                                       recipient_auths_0[9],
                                       recipient_auths_0[10],
                                       recipient_auths_0[11],
                                       recipient_auths_0[12],
                                       recipient_auths_0[13],
                                       recipient_auths_0[14],
                                       recipient_auths_0[15],
                                       recipient_auths_0[16],
                                       recipient_auths_0[17],
                                       recipient_auths_0[18]];
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(5n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(updated_recipient_auths_0),
                                                                            alignment: _descriptor_9.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(4n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(request_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { rem: { cached: false } },
                     { ins: { cached: true, n: 2 } }]);
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count:
                                  ((t1) => {
                                    if (t1 > 4294967295n)
                                      throw new __compactRuntime.CompactError('bank.compact line 366 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                    return t1;
                                  })(account_0.transaction_count + 1n),
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([97, 117, 116, 104, 95, 97, 112, 112, 114, 111, 118, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status: account_0.status,
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_send_to_authorized_user_0(context,
                              partialProofData,
                              user_id_0,
                              recipient_id_0,
                              amount_0,
                              pin_0)
  {
    __compactRuntime.assert(amount_0 > 0n, 'Transfer amount must be positive');
    __compactRuntime.assert(!this.#_equal_11(user_id_0, recipient_id_0),
                            'Cannot transfer to yourself');
    const auth_id_0 = this.#_persistentHash_4(context,
                                              partialProofData,
                                              [user_id_0, recipient_id_0]);
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(2n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'No authorization - recipient must approve first');
    const auth_0 = _descriptor_7.fromValue(Contract._query(context,
                                                           partialProofData,
                                                           [
                                                            { dup: { n: 0 } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_6.toValue(1n),
                                                                                       alignment: _descriptor_6.alignment() } },
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_6.toValue(2n),
                                                                                       alignment: _descriptor_6.alignment() } }] } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_1.toValue(auth_id_0),
                                                                                       alignment: _descriptor_1.alignment() } }] } },
                                                            { popeq: { cached: false,
                                                                       result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_12(auth_0.permission_type, 0n),
                            'Authorization is not for transfers - only for balance disclosure');
    __compactRuntime.assert(amount_0 <= auth_0.max_amount,
                            'Amount exceeds authorized limit');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Sender account does not exist');
    const sender_account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_13(sender_account_0.owner_hash,
                                            this.#_public_key_0(context,
                                                                partialProofData,
                                                                pin_0)),
                            'Authentication failed');
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                pin_0]);
    const sender_encrypted_0 = _descriptor_1.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                                   alignment: _descriptor_6.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    const sender_balance_0 = _descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(10n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(sender_encrypted_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value);
    const current_shared_encrypted_0 = this.#_encrypt_balance_0(context,
                                                                partialProofData,
                                                                sender_balance_0,
                                                                auth_0.shared_encryption_key);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(11n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_shared_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    __compactRuntime.assert(sender_balance_0 >= amount_0,
                            'Insufficient token balance');
    let t_0;
    const new_sender_balance_0 = (t_0 = amount_0,
                                  (__compactRuntime.assert(!(sender_balance_0
                                                             <
                                                             t_0),
                                                           'result of subtraction would be negative'),
                                   sender_balance_0 - t_0));
    const new_sender_encrypted_0 = this.#_encrypt_balance_0(context,
                                                            partialProofData,
                                                            new_sender_balance_0,
                                                            user_key_0);
    const tmp_0 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(sender_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_sender_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_sender_balance_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(9n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_sender_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const pending_amount_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(3n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                                                                             alignment: _descriptor_1.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value)
                             ?
                             _descriptor_1.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(3n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(auth_id_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value)
                             :
                             this.#_encrypt_balance_0(context,
                                                      partialProofData,
                                                      0n,
                                                      auth_0.shared_encryption_key);
    const has_mapping_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                  partialProofData,
                                                                  [
                                                                   { dup: { n: 0 } },
                                                                   { idx: { cached: false,
                                                                            pushPath: false,
                                                                            path: [
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_6.toValue(1n),
                                                                                              alignment: _descriptor_6.alignment() } },
                                                                                   { tag: 'value',
                                                                                     value: { value: _descriptor_6.toValue(7n),
                                                                                              alignment: _descriptor_6.alignment() } }] } },
                                                                   { push: { storage: false,
                                                                             value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(pending_amount_0),
                                                                                                                          alignment: _descriptor_1.alignment() }).encode() } },
                                                                   'member',
                                                                   { popeq: { cached: true,
                                                                              result: undefined } }]).value);
    const current_total_0 = has_mapping_0 ?
                            _descriptor_0.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(7n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_1.toValue(pending_amount_0),
                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            :
                            0n;
    const new_total_0 = ((t1) => {
                          if (t1 > 18446744073709551615n)
                            throw new __compactRuntime.CompactError('bank.compact line 422 char 21: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                          return t1;
                        })(current_total_0 + amount_0);
    const new_encrypted_amount_0 = this.#_encrypt_balance_0(context,
                                                            partialProofData,
                                                            new_total_0,
                                                            auth_0.shared_encryption_key);
    if (has_mapping_0) {
      const tmp_1 = 0n;
      Contract._query(context,
                      partialProofData,
                      [
                       { idx: { cached: false,
                                pushPath: true,
                                path: [
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(1n),
                                                  alignment: _descriptor_6.alignment() } },
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(7n),
                                                  alignment: _descriptor_6.alignment() } }] } },
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(pending_amount_0),
                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } },
                       { ins: { cached: true, n: 2 } }]);
    }
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(7n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_amount_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_total_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(3n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_amount_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const updated_sender_0 = { exists: sender_account_0.exists,
                               owner_hash: sender_account_0.owner_hash,
                               public_key: sender_account_0.public_key,
                               transaction_count:
                                 ((t1) => {
                                   if (t1 > 4294967295n)
                                     throw new __compactRuntime.CompactError('bank.compact line 439 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                   return t1;
                                 })(sender_account_0.transaction_count + 1n),
                               last_transaction:
                                 this.#_persistentHash_2(context,
                                                         partialProofData,
                                                         new Uint8Array([116, 111, 107, 101, 110, 95, 116, 114, 97, 110, 115, 102, 101, 114, 95, 115, 101, 110, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                               status: sender_account_0.status,
                               created_at: sender_account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_sender_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_2 = this.#_persistentHash_1(context,
                                          partialProofData,
                                          [new Uint8Array([116, 111, 107, 101, 110, 95, 116, 114, 97, 110, 115, 102, 101, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           user_id_0,
                                           recipient_id_0]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_2),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_claim_authorized_transfer_0(context,
                                partialProofData,
                                user_id_0,
                                sender_id_0,
                                pin_0)
  {
    const auth_id_0 = this.#_persistentHash_4(context,
                                              partialProofData,
                                              [sender_id_0, user_id_0]);
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(2n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'No authorization exists');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_14(account_0.owner_hash,
                                            this.#_public_key_0(context,
                                                                partialProofData,
                                                                pin_0)),
                            'Authentication failed');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(3n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'No pending transfer to claim');
    const encrypted_amount_0 = _descriptor_1.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                                   alignment: _descriptor_6.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(auth_id_0),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    const auth_0 = _descriptor_7.fromValue(Contract._query(context,
                                                           partialProofData,
                                                           [
                                                            { dup: { n: 0 } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_6.toValue(1n),
                                                                                       alignment: _descriptor_6.alignment() } },
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_6.toValue(2n),
                                                                                       alignment: _descriptor_6.alignment() } }] } },
                                                            { idx: { cached: false,
                                                                     pushPath: false,
                                                                     path: [
                                                                            { tag: 'value',
                                                                              value: { value: _descriptor_1.toValue(auth_id_0),
                                                                                       alignment: _descriptor_1.alignment() } }] } },
                                                            { popeq: { cached: false,
                                                                       result: undefined } }]).value);
    __compactRuntime.assert(this.#_equal_15(auth_0.permission_type, 0n),
                            'Authorization is not for transfers - only for balance disclosure');
    const shared_key_0 = this.#_persistentHash_1(context,
                                                 partialProofData,
                                                 [user_id_0,
                                                  sender_id_0,
                                                  this.#_persistentHash_2(context,
                                                                          partialProofData,
                                                                          pin_0)]);
    __compactRuntime.assert(this.#_equal_16(auth_0.shared_encryption_key,
                                            shared_key_0),
                            'Invalid encryption key');
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(7n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(encrypted_amount_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'No pending transfer found');
    const pending_amount_0 = _descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                                 alignment: _descriptor_6.alignment() } },
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_6.toValue(7n),
                                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(encrypted_amount_0),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value);
    __compactRuntime.assert(pending_amount_0 > 0n, 'No pending amount to claim');
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                pin_0]);
    const current_encrypted_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value)
                                ?
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                    alignment: _descriptor_1.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value)
                                :
                                this.#_encrypt_balance_0(context,
                                                         partialProofData,
                                                         0n,
                                                         user_key_0);
    const current_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(10n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_0.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(10n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              0n;
    const new_balance_0 = ((t1) => {
                            if (t1 > 18446744073709551615n)
                              throw new __compactRuntime.CompactError('bank.compact line 482 char 23: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                            return t1;
                          })(current_balance_0 + pending_amount_0);
    const new_encrypted_0 = this.#_encrypt_balance_0(context,
                                                     partialProofData,
                                                     new_balance_0,
                                                     user_key_0);
    if (_descriptor_2.fromValue(Contract._query(context,
                                                partialProofData,
                                                [
                                                 { dup: { n: 0 } },
                                                 { idx: { cached: false,
                                                          pushPath: false,
                                                          path: [
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() } },
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_6.toValue(10n),
                                                                            alignment: _descriptor_6.alignment() } }] } },
                                                 { push: { storage: false,
                                                           value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                        alignment: _descriptor_1.alignment() }).encode() } },
                                                 'member',
                                                 { popeq: { cached: true,
                                                            result: undefined } }]).value))
    {
      const tmp_0 = 0n;
      Contract._query(context,
                      partialProofData,
                      [
                       { idx: { cached: false,
                                pushPath: true,
                                path: [
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(1n),
                                                  alignment: _descriptor_6.alignment() } },
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(10n),
                                                  alignment: _descriptor_6.alignment() } }] } },
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } },
                       { ins: { cached: true, n: 2 } }]);
    }
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_balance_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(9n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const zero_encrypted_0 = this.#_encrypt_balance_0(context,
                                                      partialProofData,
                                                      0n,
                                                      shared_key_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(3n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(auth_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(zero_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_1 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(7n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(encrypted_amount_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count:
                                  ((t1) => {
                                    if (t1 > 4294967295n)
                                      throw new __compactRuntime.CompactError('bank.compact line 506 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                    return t1;
                                  })(account_0.transaction_count + 1n),
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([116, 111, 107, 101, 110, 95, 116, 114, 97, 110, 115, 102, 101, 114, 95, 99, 108, 97, 105, 109, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status: account_0.status,
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_2 = this.#_persistentHash_1(context,
                                          partialProofData,
                                          [new Uint8Array([116, 111, 107, 101, 110, 95, 116, 114, 97, 110, 115, 102, 101, 114, 95, 99, 108, 97, 105, 109, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           sender_id_0,
                                           user_id_0]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_2),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_get_token_balance_0(context, partialProofData, user_id_0, pin_0) {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    const expected_owner_0 = this.#_public_key_0(context,
                                                 partialProofData,
                                                 pin_0);
    __compactRuntime.assert(this.#_equal_17(account_0.owner_hash,
                                            expected_owner_0),
                            'Authentication failed');
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                pin_0]);
    const encrypted_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value)
                                ?
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                    alignment: _descriptor_1.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value)
                                :
                                this.#_encrypt_balance_0(context,
                                                         partialProofData,
                                                         0n,
                                                         user_key_0);
    const balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(1n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(10n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { push: { storage: false,
                                                                         value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(encrypted_balance_0),
                                                                                                                      alignment: _descriptor_1.alignment() }).encode() } },
                                                               'member',
                                                               { popeq: { cached: true,
                                                                          result: undefined } }]).value)
                      ?
                      _descriptor_0.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(1n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(10n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(encrypted_balance_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value)
                      :
                      0n;
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count: account_0.transaction_count,
                                last_transaction:
                                  this.#_persistentHash_2(context,
                                                          partialProofData,
                                                          new Uint8Array([116, 111, 107, 101, 110, 95, 98, 97, 108, 97, 110, 99, 101, 95, 99, 104, 101, 99, 107, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])),
                                status: account_0.status,
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_set_timestamp_0(context, partialProofData, timestamp_0) {
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(14n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(timestamp_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_verify_account_status_0(context, partialProofData, user_id_0, pin_0) {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(0n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Account does not exist');
    const account_0 = _descriptor_5.fromValue(Contract._query(context,
                                                              partialProofData,
                                                              [
                                                               { dup: { n: 0 } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } },
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_6.toValue(0n),
                                                                                          alignment: _descriptor_6.alignment() } }] } },
                                                               { idx: { cached: false,
                                                                        pushPath: false,
                                                                        path: [
                                                                               { tag: 'value',
                                                                                 value: { value: _descriptor_1.toValue(user_id_0),
                                                                                          alignment: _descriptor_1.alignment() } }] } },
                                                               { popeq: { cached: false,
                                                                          result: undefined } }]).value);
    const expected_owner_0 = this.#_public_key_0(context,
                                                 partialProofData,
                                                 pin_0);
    __compactRuntime.assert(this.#_equal_18(account_0.owner_hash,
                                            expected_owner_0),
                            'Authentication failed');
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                pin_0]);
    const encrypted_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value)
                                ?
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                    alignment: _descriptor_1.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value)
                                :
                                this.#_encrypt_balance_0(context,
                                                         partialProofData,
                                                         0n,
                                                         user_key_0);
    const token_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(10n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(encrypted_balance_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value)
                            ?
                            _descriptor_0.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(10n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_1.toValue(encrypted_balance_0),
                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value)
                            :
                            0n;
    __compactRuntime.assert(token_balance_0 >= 5n,
                            'Token balance too low for verification');
    __compactRuntime.assert(account_0.transaction_count >= 1n,
                            'Insufficient transaction history');
    const updated_account_0 = { exists: account_0.exists,
                                owner_hash: account_0.owner_hash,
                                public_key: account_0.public_key,
                                transaction_count: account_0.transaction_count,
                                last_transaction: account_0.last_transaction,
                                status:
                                  new Uint8Array([118, 101, 114, 105, 102, 105, 101, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                created_at: account_0.created_at };
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(0n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(updated_account_0),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    return [];
  }
  #_valid_pin_format_0(context, partialProofData, pin_0) {
    const zero_pin_0 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    return !this.#_equal_19(pin_0, zero_pin_0);
  }
  #_public_key_0(context, partialProofData, sk_0) {
    return this.#_persistentHash_4(context,
                                   partialProofData,
                                   [new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 98, 97, 110, 107, 58, 112, 107, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    sk_0]);
  }
  #_mint_bank_tokens_0(context,
                       partialProofData,
                       user_id_0,
                       amount_0,
                       user_pin_0)
  {
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                user_pin_0]);
    const current_encrypted_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value)
                                ?
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                    alignment: _descriptor_1.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value)
                                :
                                this.#_encrypt_balance_0(context,
                                                         partialProofData,
                                                         0n,
                                                         user_key_0);
    const current_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(10n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_0.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(10n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              0n;
    const new_balance_0 = ((t1) => {
                            if (t1 > 18446744073709551615n)
                              throw new __compactRuntime.CompactError('bank.compact line 610 char 23: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                            return t1;
                          })(current_balance_0 + amount_0);
    const new_encrypted_0 = this.#_encrypt_balance_0(context,
                                                     partialProofData,
                                                     new_balance_0,
                                                     user_key_0);
    if (_descriptor_2.fromValue(Contract._query(context,
                                                partialProofData,
                                                [
                                                 { dup: { n: 0 } },
                                                 { idx: { cached: false,
                                                          pushPath: false,
                                                          path: [
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_6.toValue(1n),
                                                                            alignment: _descriptor_6.alignment() } },
                                                                 { tag: 'value',
                                                                   value: { value: _descriptor_6.toValue(10n),
                                                                            alignment: _descriptor_6.alignment() } }] } },
                                                 { push: { storage: false,
                                                           value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                        alignment: _descriptor_1.alignment() }).encode() } },
                                                 'member',
                                                 { popeq: { cached: true,
                                                            result: undefined } }]).value))
    {
      const tmp_0 = 0n;
      Contract._query(context,
                      partialProofData,
                      [
                       { idx: { cached: false,
                                pushPath: true,
                                path: [
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(1n),
                                                  alignment: _descriptor_6.alignment() } },
                                       { tag: 'value',
                                         value: { value: _descriptor_6.toValue(10n),
                                                  alignment: _descriptor_6.alignment() } }] } },
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } },
                       { ins: { cached: true, n: 2 } }]);
    }
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_balance_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(9n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    const tmp_1 = ((t1) => {
                    if (t1 > 18446744073709551615n)
                      throw new __compactRuntime.CompactError('bank.compact line 623 char 24: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                    return t1;
                  })(_descriptor_0.fromValue(Contract._query(context,
                                                             partialProofData,
                                                             [
                                                              { dup: { n: 0 } },
                                                              { idx: { cached: false,
                                                                       pushPath: false,
                                                                       path: [
                                                                              { tag: 'value',
                                                                                value: { value: _descriptor_6.toValue(1n),
                                                                                         alignment: _descriptor_6.alignment() } },
                                                                              { tag: 'value',
                                                                                value: { value: _descriptor_6.toValue(12n),
                                                                                         alignment: _descriptor_6.alignment() } }] } },
                                                              { popeq: { cached: false,
                                                                         result: undefined } }]).value)
                     +
                     amount_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(12n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_burn_bank_tokens_0(context,
                       partialProofData,
                       user_id_0,
                       amount_0,
                       user_pin_0)
  {
    const user_key_0 = this.#_persistentHash_4(context,
                                               partialProofData,
                                               [new Uint8Array([117, 115, 101, 114, 58, 98, 97, 108, 97, 110, 99, 101, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                                user_pin_0]);
    const current_encrypted_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value)
                                ?
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(1n),
                                                                                                    alignment: _descriptor_6.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_6.toValue(9n),
                                                                                                    alignment: _descriptor_6.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_1.toValue(user_id_0),
                                                                                                    alignment: _descriptor_1.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value)
                                :
                                this.#_encrypt_balance_0(context,
                                                         partialProofData,
                                                         0n,
                                                         user_key_0);
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(1n),
                                                                                                alignment: _descriptor_6.alignment() } },
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_6.toValue(10n),
                                                                                                alignment: _descriptor_6.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'User has no token balance');
    const current_balance_0 = _descriptor_0.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(1n),
                                                                                                  alignment: _descriptor_6.alignment() } },
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_6.toValue(10n),
                                                                                                  alignment: _descriptor_6.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_1.toValue(current_encrypted_0),
                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value);
    __compactRuntime.assert(current_balance_0 >= amount_0,
                            'Insufficient token balance to burn');
    const new_balance_0 = (__compactRuntime.assert(!(current_balance_0
                                                     <
                                                     amount_0),
                                                   'result of subtraction would be negative'),
                           current_balance_0 - amount_0);
    const new_encrypted_0 = this.#_encrypt_balance_0(context,
                                                     partialProofData,
                                                     new_balance_0,
                                                     user_key_0);
    const tmp_0 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(current_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(10n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new_balance_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } },
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(9n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(user_id_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_encrypted_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 2 } }]);
    let t_0;
    const tmp_1 = (t_0 = _descriptor_0.fromValue(Contract._query(context,
                                                                 partialProofData,
                                                                 [
                                                                  { dup: { n: 0 } },
                                                                  { idx: { cached: false,
                                                                           pushPath: false,
                                                                           path: [
                                                                                  { tag: 'value',
                                                                                    value: { value: _descriptor_6.toValue(1n),
                                                                                             alignment: _descriptor_6.alignment() } },
                                                                                  { tag: 'value',
                                                                                    value: { value: _descriptor_6.toValue(12n),
                                                                                             alignment: _descriptor_6.alignment() } }] } },
                                                                  { popeq: { cached: false,
                                                                             result: undefined } }]).value),
                   (__compactRuntime.assert(!(t_0 < amount_0),
                                            'result of subtraction would be negative'),
                    t_0 - amount_0));
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_6.toValue(1n),
                                                alignment: _descriptor_6.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(12n),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    return [];
  }
  #_encrypt_balance_0(context, partialProofData, balance_0, encryption_key_0) {
    const balance_bytes_0 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const encrypted_0 = this.#_persistentHash_4(context,
                                                partialProofData,
                                                [this.#_persistentHash_3(context,
                                                                         partialProofData,
                                                                         balance_0),
                                                 encryption_key_0]);
    return encrypted_0;
  }
  #_equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_6(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_7(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_8(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_9(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_12(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_13(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_14(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_15(x0, y0) {
    if (x0 !== y0) return false;
    return true;
  }
  #_equal_16(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_17(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_18(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_19(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  static _query(context, partialProofData, prog) {
    var res;
    try {
      res = context.transactionContext.query(prog, __compactRuntime.CostModel.dummyCostModel());
    } catch (err) {
      throw new __compactRuntime.CompactError(err.toString());
    }
    context.transactionContext = res.context;
    var reads = res.events.filter((e) => e.tag === 'read');
    var i = 0;
    partialProofData.publicTranscript = partialProofData.publicTranscript.concat(prog.map((op) => {
      if(typeof(op) === 'object' && 'popeq' in op) {
        return { popeq: {
          ...op.popeq,
          result: reads[i++].content,
        } };
      } else {
        return op;
      }
    }));
    if(res.events.length == 1 && res.events[0].tag === 'read') {
      return res.events[0].content;
    } else {
      return res.events;
    }
  }
}
function ledger(state) {
  const context = {
    originalState: state,
    transactionContext: new __compactRuntime.QueryContext(state, __compactRuntime.dummyContractAddress())
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    all_accounts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 54 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 54 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_5.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(0n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[0].asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get total_accounts() {
      return _descriptor_0.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(0n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: true,
                                                                 result: undefined } }]).value);
    },
    get last_global_transaction() {
      return _descriptor_1.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    active_authorizations: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 59 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 59 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_7.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(2n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_7.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    encrypted_balances: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 60 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 60 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_1.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(3n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[3];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    pending_auth_requests: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(4n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(4n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 61 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(4n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 61 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_8.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(4n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[4];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_8.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    user_as_recipient_auths: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(5n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(5n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 62 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(5n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 62 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_9.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(5n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[5];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    user_as_sender_auths: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(6n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(6n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 63 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(6n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 63 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_9.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(6n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    encrypted_amount_mappings: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(7n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(7n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 66 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(7n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 66 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(7n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get bank_token_id() {
      return _descriptor_1.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(8n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    encrypted_user_balances: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 70 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 70 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_1.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(9n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    user_balance_mappings: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(10n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(10n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 71 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(10n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 71 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(10n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[10];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    shared_balance_access: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(11n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(11n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'bank.compact line 72 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(11n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'bank.compact line 72 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_1.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(1n),
                                                                                   alignment: _descriptor_6.alignment() } },
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_6.toValue(11n),
                                                                                   alignment: _descriptor_6.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_1.toValue(key_0),
                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1].asArray()[11];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get total_token_supply() {
      return _descriptor_0.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(12n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    get token_mint_authority() {
      return _descriptor_1.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(13n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    get current_timestamp() {
      return _descriptor_3.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(1n),
                                                                                 alignment: _descriptor_6.alignment() } },
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_6.toValue(14n),
                                                                                 alignment: _descriptor_6.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  originalState: new __compactRuntime.ContractState(),
  transactionContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({ });
const pureCircuits = {
  public_key: (...args_0) => _dummyContract.circuits.public_key(_emptyContext, ...args_0).result
};
const contractReferenceLocations = { tag: 'publicLedgerArray', indices: { } };
exports.Contract = Contract;
exports.ledger = ledger;
exports.pureCircuits = pureCircuits;
exports.contractReferenceLocations = contractReferenceLocations;
//# sourceMappingURL=index.cjs.map

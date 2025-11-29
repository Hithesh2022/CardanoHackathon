use aiken/collection/list
use aiken/crypto.{VerificationKeyHash, blake2b_256}
use aiken/primitive/bytearray
use cardano/transaction.{Input, Output, Transaction, ValidityRange}
use cardano/address.{Address, Credential}

// Credit score datum stored at script address
pub type ScoreDatum {
  owner: VerificationKeyHash,
  score_hash: ByteArray,
  score_bucket: Int,
  // Buckets: 0=300-499, 1=500-649, 2=650-749, 3=750-850, 4=850+
  nonce: ByteArray,
  expires_at: Int,
  // POSIXTime in milliseconds
}

pub type ScoreRedeemer {
  RevealBucket { requested_bucket: Int }
  UpdateScore { new_hash: ByteArray, new_bucket: Int, new_nonce: ByteArray }
}

validator score_proof {
  spend(
    datum_opt: Option<ScoreDatum>,
    redeemer: ScoreRedeemer,
    _own_ref: Input,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt

    when redeemer is {
      RevealBucket { requested_bucket } -> {
        // Allow selective disclosure of score bucket without revealing exact score
        let valid_bucket = requested_bucket == datum.score_bucket
        let not_expired = check_not_expired(tx.validity_range, datum.expires_at)
        let signed_by_owner = list.has(tx.extra_signatories, datum.owner)

        valid_bucket && not_expired && signed_by_owner
      }

      UpdateScore { new_hash, new_bucket, new_nonce } -> {
        // Owner can update their score capsule with new proofs
        let signed_by_owner = list.has(tx.extra_signatories, datum.owner)
        
        // Ensure new datum is properly formed
        expect Some(new_output) = find_own_output(tx.outputs, _own_ref)
        expect Some(new_datum): Option<ScoreDatum> = new_output.datum
        
        let valid_update =
          new_datum.owner == datum.owner && new_datum.score_hash == new_hash && new_datum.score_bucket == new_bucket && new_datum.nonce == new_nonce

        signed_by_owner && valid_update
      }
    }
  }

  else(_) {
    fail
  }
}

fn check_not_expired(validity_range: ValidityRange, expires_at: Int) -> Bool {
  when validity_range is {
    transaction.Finite { upper_bound } -> upper_bound < expires_at
    _ -> False
  }
}

fn find_own_output(outputs: List<Output>, own_input: Input) -> Option<Output> {
  list.find(
    outputs,
    fn(output) {
      when output.address.payment_credential is {
        address.ScriptCredential(hash) ->
          when own_input.output.address.payment_credential is {
            address.ScriptCredential(own_hash) -> hash == own_hash
            _ -> False
          }
        _ -> False
      }
    },
  )
}

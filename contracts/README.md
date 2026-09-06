# AssetFlow RWA contracts

`AssetFlowRWA.sol` is the controlled ERC-20 issuance primitive for Phase 5.

## Design

- `ISSUER_ROLE` is the only role allowed to issue supply.
- `maxSupply` is immutable and prevents over-issuance.
- `assetId` binds the deployed token to an AssetFlow asset reference.
- `issue()` accepts an AssetFlow issuance-request hash so the on-chain event can be reconciled with the institutional approval record.
- Legal, custody and investor-eligibility approval remains off-chain in AssetFlow; this contract does not pretend to replace those controls.

## Deployment

Deploy only after an audited deployment configuration and approved issuer wallet are available. The constructor expects:

`name, symbol, assetId, maxSupply, admin, issuer`

The repository intentionally does not contain a private key or live deployment credential.

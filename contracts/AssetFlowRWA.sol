// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title AssetFlow RWA Token
/// @notice Controlled ERC-20 issuance primitive for approved real-world-asset offerings.
/// @dev AssetFlow remains the system of record for legal/compliance approval. This contract
///      only enforces the on-chain issuer role and emits an immutable issuance event.
contract AssetFlowRWA is ERC20, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    string public assetId;
    uint256 public immutable maxSupply;
    uint256 public totalIssued;

    event AssetIssued(
        string indexed assetReference,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed issuanceRequestHash
    );

    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetId_,
        uint256 maxSupply_,
        address admin,
        address issuer
    ) ERC20(name_, symbol_) {
        require(admin != address(0) && issuer != address(0), "zero address");
        require(maxSupply_ > 0, "zero max supply");
        assetId = assetId_;
        maxSupply = maxSupply_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, issuer);
    }

    function issue(
        address recipient,
        uint256 amount,
        bytes32 issuanceRequestHash
    ) external onlyRole(ISSUER_ROLE) {
        require(recipient != address(0), "zero recipient");
        require(amount > 0, "zero amount");
        require(totalIssued + amount <= maxSupply, "max supply exceeded");
        totalIssued += amount;
        _mint(recipient, amount);
        emit AssetIssued(assetId, recipient, amount, issuanceRequestHash);
    }

    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalIssued;
    }
}

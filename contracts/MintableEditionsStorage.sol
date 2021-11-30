// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import "./EditionMetadata.sol";

/**
 * This contract allows dynamic NFT minting.
 * 
 * Operations allow for selling publicly, partial or total giveaways, direct giveaways and rewardings.
 */
contract MintableEditionsStorage {
    // addresses allowed to mint editions
    mapping(address => uint16) internal allowedMinters;

    // price for sale
    uint256 public price;

    // token description
    string public description;

    // token content URL
    string public contentUrl;
    // hash for the associated content
    bytes32 public contentHash;
    // type of content
    uint8 internal contentType;
    
    // the number of editions this contract can mint
    uint64 public size;
    
    // royalties ERC2981 in bps
    uint8 internal royaltiesType;
    uint16 public royalties;

    // NFT rendering logic
    EditionMetadata internal metadata;

    // gap
    uint256[50] private __gap;
}
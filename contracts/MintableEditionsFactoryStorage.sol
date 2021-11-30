// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

contract MintableEditionsFactoryStorage {

    // Address for implementation of contract to clone
    address internal implementation;

    // Address for implementation of metadata contract to use
    address internal metadata;

    // Hash codes of editions contents: used to prevent re-issuing of the same content
    mapping(bytes32 => bool) internal contents;

    // gap
    uint256[50] private __gap;
}
// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

interface IMintableEditions {
    /**
     * Mints one token for the msg.sender. 
     */
    function mintEdition() external returns (uint256);
    
    /**
     * Mints multiple tokens, one for each of the given list of addresses.
     * 
     * @param to list of addresses to send the newly minted tokens to
     */
    function mintEditions(address[] memory to) external returns (uint256);

    /** 
     * Returns the number of tokens still available for minting
     */
    function numberCanMint() external view returns (uint256);

    /**
     * Returns the owner of the edition.
     */
    function owner() external view returns (address);
}
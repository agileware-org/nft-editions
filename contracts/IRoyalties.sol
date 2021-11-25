// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

interface IRoyalties {
    struct RoyaltyInfo {
        address recipient;
        uint24 bps;
        uint64[3] params;
        address alt;
    }
    
    function royaltyInfo(uint256 _value) external view returns (address receiver, uint256 royaltyAmount);
    function initialize(address receiver, uint256 bps, bytes32[] memory data) external;
    function paid(address from, address to, uint256 value) external;

    /**
     * @notice Require that the token has had a content hash set
     */
    modifier validBPS(uint256 _bps) {
        require(_bps <= 10000, 'ERC2981: Too high');
        _;
    }
}
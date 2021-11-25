// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

interface IRoyalties is IERC2981 {
    struct RoyaltyInfo {
        address recipient;
        uint24 bps;
        uint64[3] params;
        address alt;
    }
    
    function initialize(address receiver, uint256 bps, bytes32[] memory data) external;

    /**
     * @notice Require that the token has had a content hash set
     */
    modifier validBPS(uint256 _bps) {
        require(_bps <= 10000, 'ERC2981: Too high');
        _;
    }
}
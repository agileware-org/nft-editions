// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRoyalties is IERC2981 {
    struct RoyaltyInfo {
        address recipient;
        uint24 bps;
        uint64[3] params;
        address alt;
    }

    function label() external returns (string memory);
    function initialize(address receiver, uint256 bps, bytes32[] memory data) external;

    /**
     * @notice Require that the token has had a content hash set
     */
    modifier validBPS(uint256 _bps) {
        require(_bps <= 10000, 'ERC2981: Too high');
        _;
    }
}
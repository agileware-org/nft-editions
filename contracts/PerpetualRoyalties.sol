// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;


import {IERC2981Upgradeable, IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IRoyalties} from "./IRoyalties.sol";

/**
 * Perpetual royalties, pay a fixed percentage indefinitely.
 */
contract PerpetualRoyalties is IRoyalties, Initializable {
    RoyaltyInfo private info;
    
    /**
     * @param _recipient Address of the royalties collector
     * @param _bps Royalties percentage in BPS (1/10000)
     */
    function initialize(address _recipient, uint256 _bps, bytes32[] memory) public override initializer validBPS(_bps) {
        info.recipient = _recipient;
        info.bps = uint16(_bps);
    }
    
    function royaltyInfo(uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        return (info.recipient, (_value * info.bps) / 10000);
    }
    
    function paid(address, address, uint256) external view override {}
}
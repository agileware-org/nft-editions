// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {IERC2981, IERC165} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IRoyalties} from "./IRoyalties.sol";
/**
 * Royalties paid within limits.
 * The colleector can establish a lower sale value limit, so that royalties are not collected if the NFT is sold for a value equal or less what specified.
 */
contract LimitedRoyalties is IRoyalties, Initializable {
    RoyaltyInfo private info;
    
    uint256 minValue;
    
    /**
     * @param _recipient Address of the royalties collector
     * @param _bps Royalties percentage in BPS (1/10000)
     * @param _data at 0, minimum sale value: no royalties are collected for a sale value equal or lower than the specified value
     */
    function initialize(address _recipient, uint256 _bps, bytes32[] memory _data) public override initializer validBPS(_bps) {
        info.recipient = _recipient;
        info.bps = uint16(_bps);
        minValue = uint256(_data[0]);
    }
    
    function royaltyInfo(uint256, uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        if (_value <= minValue) {
            return (address(0x0), 0);
        }
        return (info.recipient, (_value * info.bps) / 10000);
    }
    
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return type(IERC2981).interfaceId == interfaceId;
    }
}
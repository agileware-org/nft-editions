// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */
pragma solidity 0.8.6;

import {IERC2981, IERC165} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ITransferAwareRoyalties} from "./ITransferAwareRoyalties.sol";

/**
 * Progressively reducing royalties, starting at a value which gets reduced after each sale.
 */
contract ProgressiveRoyalties is ITransferAwareRoyalties, Initializable {
    RoyaltyInfo private info;
    
    /**
     * @param _recipient Address of the royalties collector
     * @param _bps Royalties percentage in BPS (1/10000)
     * @param _data at 0 the reduction percentage
     *              at 1 the absoolute bps value reduction
     */
    function initialize(address _recipient, uint256 _bps, bytes32[] memory _data) public override initializer validBPS(_bps) {
        info.recipient = _recipient;
        info.bps = uint16(_bps);
        info.params[0] = SafeCast.toUint8(uint256(_data[0])); // params[0] stores the reduction percentage
        require(info.params[0] < 100, "Invalid reduction percentage");
        info.params[1] = SafeCast.toUint16(uint256(_data[1])); // params[1] stores the absolute bps reduction
        require(info.params[1] < 10000, "Invalid reduction");
    }
    
    function royaltyInfo(uint256, uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        return (info.recipient, (_value * info.bps) / 10000);
    }
    
    
    function transferred(address, address, uint256) external override {
        uint24 newBps = info.bps;
        if (info.params[0] > 0) {
            newBps = uint24((newBps * (100 - info.params[0]) / 100));
        }
        if (newBps > info.params[1]) {
            newBps = newBps - uint16(info.params[1]);
        } else {
            newBps = 0;
        }
        info.bps = newBps;
    }
    
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return type(IERC2981).interfaceId == interfaceId;
    }
}
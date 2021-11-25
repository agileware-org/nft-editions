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
import {IRoyalties} from "./IRoyalties.sol";

/**
 * Time limited royalties, pay a fixed percentage until specified block timestamp is reached.
 */
contract UntilRoyalties is IRoyalties, Initializable {
    RoyaltyInfo private info;
    
    /**
     * @param _recipient Address of the royalties collector
     * @param _bps Royalties percentage in BPS (1/10000)
     * @param _data at 0 the timestamp after which no royalties are paid
     */
    function initialize(address _recipient, uint256 _bps, bytes32[] memory _data) public override initializer validBPS(_bps) {
        info.recipient = _recipient;
        info.bps = uint16(_bps);
        info.params[0] = SafeCast.toUint64(uint256(_data[0])); // params[0] stores the timestamp of royalties payout ending
        require(info.params[0] > block.timestamp, "Expires in the past");
    }
    
    function royaltyInfo(uint256, uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        if (block.timestamp < info.params[0]) {
            return (info.recipient, (_value * info.bps) / 10000);
        }
        return (address(0x0), 0);
    }
    
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return type(IERC2981).interfaceId == interfaceId;
    }
}
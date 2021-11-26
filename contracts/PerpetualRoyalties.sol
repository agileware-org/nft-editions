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
 * Perpetual royalties, pay a fixed percentage indefinitely.
 */
contract PerpetualRoyalties is IRoyalties, Initializable {
    RoyaltyInfo public info;

    /**
     * @param _recipient Address of the royalties collector
     * @param _bps Royalties percentage in BPS (1/10000)
     */
    function initialize(address _recipient, uint256 _bps, bytes32[] memory) public override initializer validBPS(_bps) {
        info.recipient = _recipient;
        info.bps = uint16(_bps);
    }

    function label() public override pure returns (string memory) {
        return "Perpetual 1.0";
    }
    
    function royaltyInfo(uint256, uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        return (info.recipient, (_value * info.bps) / 10000);
    }
    
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return type(IERC2981).interfaceId == interfaceId || type(IRoyalties).interfaceId == interfaceId;
    }
}
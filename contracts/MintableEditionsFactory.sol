// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./MintableEditions.sol";

contract MintableEditionsFactory {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Counter for current contract id
    CountersUpgradeable.Counter internal _counter;

    // Address for implementation of Edition contract to clone
    address private _implementation;

    // Store for hash codes of editions contents: used to prevent re-issuing of the same content
    mapping(bytes32 => bool) private _contents;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param implementation Edition implementation contract to clone
     */
    constructor(address implementation) {
        _implementation = implementation;
    }

    /**
     * Creates a new editions contract as a factory with a deterministic address, returning the address of the newly created contract.
     * Important: None of these fields can be changed after calling this operation, with the sole exception of the contentUrl field which
     * must refer to a content having the same hash.
     * 
     * @param name name of editions, used in the title as "$name $tokenId/$size"
     * @param symbol symbol of the tokens mined by this contract
     * @param description description of tokens of this edition
     * @param contentUrl content URL of the edition tokens
     * @param contentHash SHA256 of the tokens content in bytes32 format (0xHASH)
     * @param contentType type of tokens content [0=image, 1=animation/video/audio]
     * @param size number of NFTs that can be minted from this contract: set to 0 for unbound
     * @param royalties perpetual royalties paid to the creator upon token selling
     * @param shares array of tuples of [address, bps] destined to the shareholders
     * @return the address of the editions contract created
     */
    function create(
        string memory name,
        string memory symbol,
        string memory description,
        string memory contentUrl,
        bytes32 contentHash,
        uint8 contentType,
        uint64 size,
        uint16 royalties,
        MintableEditions.Shares[] memory shares
    ) external returns (address) {
        require(!_contents[contentHash], "Edition: duplicated content!");
        _contents[contentHash] = true;
        uint256 id = _counter.current();
        address instance = ClonesUpgradeable.cloneDeterministic(_implementation, bytes32(abi.encodePacked(id)));
        MintableEditions(instance).initialize(msg.sender, name, symbol, description, contentUrl, contentHash, contentType, size, royalties, shares);
        emit CreatedEditions(id, msg.sender, shares, size, instance);
        _counter.increment();
        return instance;
    }

    /**
     * Gets an editions contract given the unique identifier. Contract ids are zero-based.
     * 
     * @param index zero-based index of editions contract to retrieve
     * @return the editions contract
     */
    function get(uint256 index) external view returns (MintableEditions) {
        return MintableEditions(ClonesUpgradeable.predictDeterministicAddress(_implementation, bytes32(abi.encodePacked(index)), address(this)));
    }

    /** 
     * @return the number of edition contracts created so far through this factory
     */
     function instances() external view returns (uint256) {
        return _counter.current();
    }

    /**
     * Emitted when an edition is created reserving the corresponding token IDs.
     * 
     * @param index the identifier of the newly created editions contract
     * @param creator the editions' owner
     * @param size the number of tokens this editions contract consists of
     * @param contractAddress the address of the contract representing the editions
     */
    event CreatedEditions(uint256 indexed index, address indexed creator, MintableEditions.Shares[] indexed shareholders, uint256 size, address contractAddress);
}

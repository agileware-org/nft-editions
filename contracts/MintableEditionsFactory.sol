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
    CountersUpgradeable.Counter internal counter;

    // Address for implementation of Edition contract to clone
    address private implementation;

    // Store for hash codes of editions contents: used to prevent re-issuing of the same content
    mapping(bytes32 => bool) private contents;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param _implementation Edition implementation contract to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * Creates a new editions contract as a factory with a deterministic address, returning the address of the newly created contract.
     * Important: None of these fields can be changed after calling this operation, with the sole exception of the contentUrl field which
     * must refer to a content having the same hash.
     * 
     * @param _name name of editions, used in the title as "$name $tokenId/$size"
     * @param _symbol symbol of the tokens mined by this contract
     * @param _description description of tokens of this edition
     * @param _contentUrl content URL of the edition tokens
     * @param _contentHash SHA256 of the tokens content in bytes32 format (0xHASH)
     * @param _contentType type of tokens content [0=image, 1=animation/video/audio]
     * @param _size number of NFTs that can be minted from this contract: set to 0 for unbound
     * @param _royalties perpetual royalties paid to the creator upon token selling
     * @param _shares shares in bps destined to the shareholders (one per each shareholder)
     * @return the address of the editions contract created
     */
    function create(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _contentUrl,
        bytes32 _contentHash,
        uint8 _contentType,
        uint64 _size,
        uint16 _royalties,
        MintableEditions.Shares[] memory _shares
    ) external returns (address) {
        require(!contents[_contentHash], "Edition: duplicated content!");
        contents[_contentHash] = true;
        uint256 id = counter.current();
        address instance = ClonesUpgradeable.cloneDeterministic(implementation, bytes32(abi.encodePacked(id)));
        MintableEditions(instance).initialize(msg.sender, _name, _symbol, _description, _contentUrl, _contentHash, _contentType, _size, _royalties, _shares);
        emit CreatedEditions(id, msg.sender, _shares, _size, instance);
        counter.increment();
        return instance;
    }

    /**
     * Gets an editions contract given the unique identifier. Contract ids are zero-based.
     * 
     * @param index zero-based index of editions contract to retrieve
     * @return the editions contract
     */
    function get(uint256 index) external view returns (MintableEditions) {
        return MintableEditions(ClonesUpgradeable.predictDeterministicAddress(implementation, bytes32(abi.encodePacked(index)), address(this)));
    }

    /** 
     * @return the number of edition contracts created so far through this factory
     */
     function instances() external view returns (uint256) {
        return counter.current();
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

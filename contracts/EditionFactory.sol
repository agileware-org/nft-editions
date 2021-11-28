// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ClonesUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Edition.sol";

contract EditionFactory is OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Counter for current contract id
    CountersUpgradeable.Counter private atContract;

    // Address for implementation of Edition contract to clone
    address public implementation;

    // Store for hash codes of edition contents: used to prevent re-issuing of the same content
    //mapping(bytes32 => bool) private editionHashes;

    /**
     * Initializes the factory with the address of the implementation contract template
     * 
     * @param _implementation Edition implementation contract to clone
     */
    constructor(address _implementation) {
        implementation = _implementation;
    }

    /**
     * Creates a new edition contract as a factory with a deterministic address, returning the address of the newly created Edition contract.
     * Important: None of these fields can be changed after calling this operation, with the sole exception of the contentUrl field which must refer to a content having the same hash.
     * Returns the id of the created editions contract.
     * 
     * @param _name Name of the edition contract
     * @param _symbol Symbol of the edition contract
     * @param _description Metadata: Description of the edition entry
     * @param _contentUrl Metadata: Image url (semi-required) of the edition entry
     * @param _contentHash Metadata: SHA-256 hash of the Image of the edition entry (if not image, can be 0x0)
     * @param _editionSize Total size of the edition (number of possible editions)
     */
    function createEdition(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _contentUrl,
        bytes32 _contentHash,
        uint8 _contentType,
        uint64 _editionSize,
        uint16 _royaltyBPS,
        address payable _payee
    ) external returns (uint256) {
        //require(!editionHashes[_contentHash], "Edition: duplicated content!");
        uint256 newId = atContract.current();
        address newContract = ClonesUpgradeable.cloneDeterministic(implementation, bytes32(abi.encodePacked(newId)));
        Edition(newContract).initialize(msg.sender, _name, _symbol, _description, _contentUrl, _contentHash, _contentType, _editionSize, _royaltyBPS, _payee);
        emit CreatedEdition(newId, msg.sender, _payee, _editionSize, newContract);
        atContract.increment();
        return newId;
    }

    /**
     * Gets an edition given the unique identifier
     * 
     * @param editionId id of edition to get contract for
     * @return the Edition NFT contract
     */
    function getEditionAtId(uint256 editionId) external view returns (Edition) {
        return Edition(ClonesUpgradeable.predictDeterministicAddress(implementation, bytes32(abi.encodePacked(editionId)), address(this)));
    }

    /**
     * Emitted when an edition is created reserving the corresponding token IDs.
     * 
     * @param editionId the identifier of newly created edition
     * @param creator the edition's owner
     * @param editionSize the number of NFTs this edition consists of
     * @param contractAddress the address of the contract represneting the edition
     */
    event CreatedEdition(uint256 indexed editionId, address indexed creator, address indexed payee, uint256 editionSize, address contractAddress);
}

// SPDX-License-Identifier: MIT

/**
 * ░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀░░░█▄░█▒█▀░▀█▀
 * ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██▒░░█▒▀█░█▀░▒█▒
 * 
 */

pragma solidity 0.8.6;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {IERC2981Upgradeable, IERC165Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "./EditionMetadata.sol";
import "./IMintableEditions.sol";

/**
 * This contract allows dynamic NFT minting.
 * 
 * Operations allow for selling publicly, partial or total giveaways, direct giveaways and rewardings.
 */
contract MintableEditions is ERC721Upgradeable, IERC2981Upgradeable, IMintableEditions, OwnableUpgradeable {
    
    using CountersUpgradeable for CountersUpgradeable.Counter;
    
    event PriceChanged(uint256 amount);
    event EditionSold(uint256 price, address owner);
    event PaymentReleased(address to, uint256 amount);
    event PaymentFailed(address to);

    struct Shares {
        address payable holder;
        uint16 bps;
    }

    // token id counter
    CountersUpgradeable.Counter private _counter;

    // token description
    string public _description;

    // token content URL
    string public _contentUrl;
    // hash for the associated content
    bytes32 public _contentHash;

    // type of content
    uint8 internal _contentType;
    
    // the number of editions this contract can mint
    uint64 public _size;
    
    // royalties ERC2981 in bps
    uint8 internal _royaltiesType;
    uint16 public _royalties;

    
    // NFT rendering logic
    EditionMetadata private immutable _metadata;

    // addresses allowed to mint editions
    mapping(address => uint16) internal _allowedMinters;

    // price for sale
    uint256 public _price;

    // shares
    address[] private _shareholders;
    mapping(address => uint16) public _shares;
    mapping(address => uint256) private _witdrawals;
    // balance withdrawn so far
    uint256 private _withdrawn;

    constructor(EditionMetadata metadata) initializer {
        _metadata = metadata;
    }

    /**
     * Creates a new edition and sets the only allowed minter to the address that creates/owns the edition: this can be re-assigned or updated later.
     * 
     * @param _owner can authorize, mint, gets royalties and a dividend of sales, can update the content URL.
     * @param name name of editions, used in the title as "$name $tokenId/$size"
     * @param symbol symbol of the tokens mined by this contract
     * @param description description of tokens of this edition
     * @param contentUrl content URL of the edition tokens
     * @param contentHash SHA256 of the tokens content in bytes32 format (0xHASH)
     * @param contentType type of tokens content [0=image, 1=animation/video/audio]
     * @param size number of NFTs that can be minted from this contract: set to 0 for unbound
     * @param royalties perpetual royalties paid to the creator upon token selling
     * @param shares shares in bps destined to the shareholders (one per each shareholder)
     */
    function initialize(
        address _owner,
        string memory name,
        string memory symbol,
        string memory description,
        string memory contentUrl,
        bytes32 contentHash,
        uint8 contentType,
        uint64 size,
        uint16 royalties,
        Shares[] memory shares
    ) public initializer {
        __ERC721_init(name, symbol);
        __Ownable_init();

        transferOwnership(_owner); // set ownership
        _description = description;
        _contentUrl = contentUrl;
        _contentHash = contentHash;
        _contentType = contentType;
        _size = size;
        _counter.increment(); // token ids start at 1

        require(royalties < 10_000, "Royalties too high");
        _royalties = royalties;
        
        uint16 totalShares;
        for (uint256 i = 0; i < shares.length; i++) {
            _addPayee(shares[i].holder, shares[i].bps);
            totalShares += shares[i].bps;
        }
        require(totalShares < 10_000, "Shares too high");
        _addPayee(payable(_owner), 10_000 - totalShares);
    }

    function _addPayee(address payable account, uint16 shares) internal {
        require(account != address(0), "Shareholder is zero address");
        require(shares > 0 && shares <= 10_000, "Shares are invalid");
        require(_shares[account] == 0, "Shareholder already has shares");

        _shareholders.push(account);
        _shares[account] = shares;
    }

    /**
     * Returns the number of tokens minted so far 
     */
     function totalSupply() public view returns (uint256) {
        return _counter.current() - 1;
    }

    /**
     * Basic ETH-based sales operation, performed at the given set price.
     * This operation is open to everyone as soon as the salePrice is set to a non-zero value.
     */
    function purchase() external payable returns (uint256) {
        require(_price > 0, "Not for sale");
        require(msg.value == _price, "Wrong price");
        address[] memory toMint = new address[](1);
        toMint[0] = msg.sender;
        emit EditionSold(_price, msg.sender);
        return _mintEditions(toMint);
    }

    /**
     * This operation sets the sale price, thus allowing anyone to acquire a token from this edition at the sale price via the purchase operation.
     * Setting the sale price to 0 prevents purchase of the tokens which is then allowed only to permitted addresses.
     * 
     * @param price sale price in WEI, if set to 0, no sale is allowed, otherwise the provided amount of WEI is needed to start the sale.
     */
    function setPrice(uint256 price) external onlyOwner {
        _price = price;
        emit PriceChanged(_price);
    }

    /**
     * This operation transfers all ETHs from the contract balance to the shareholders.
     */
    function withdraw() external {
        for (uint i = 0; i < _shareholders.length; i++) {
            try this.withdraw(payable(_shareholders[i])) returns (uint256 payment) {
                emit PaymentReleased(_shareholders[i], payment);
            } catch {
                emit PaymentFailed(_shareholders[i]);
            }
        }
    }

    /**
     * This operation attempts to transfer part of the contract balance to the provided shareholder based on its shares and previous witdrawals.
     *
     * @param account the address of a valid shareholder
     */
    function withdraw(address payable account) external returns (uint256) {
        uint256 totalReceived = address(this).balance + _withdrawn;
        uint256 amount = (totalReceived * _shares[account]) / 10_000 - _witdrawals[account];
        require(amount != 0, "Account is not due payment");
        _witdrawals[account] += amount;
        _withdrawn += amount;
        AddressUpgradeable.sendValue(account, amount);
        return amount;
    }

    /**
     * Internal: checks if the msg.sender is allowed to mint.
     */
    function _isAllowedToMint() internal view returns (bool) {
        return (owner() == msg.sender) || _isPublicAllowed() || (_allowedMinters[msg.sender] > 0);
    }
    
    /**
     * Internal: checks if the ZeroAddress is allowed to mint.
     */
    function _isPublicAllowed() internal view returns (bool) {
        return (_allowedMinters[address(0x0)] > 0);
    }

    /**
     * If caller is listed as an allowed minter, mints one NFT for him.
     */
    function mintEdition() external override returns (uint256) {
        require(_isAllowedToMint(), "Minting not allowed");
        address[] memory toMint = new address[](1);
        toMint[0] = msg.sender;
        if (owner() != msg.sender && !_isPublicAllowed()) {
            _allowedMinters[msg.sender] = _allowedMinters[msg.sender] - 1;
        }
        return _mintEditions(toMint);
    }

    /**
     * Mints multiple tokens, one for each of the given list of addresses.
     * Only the edition owner can use this operation and it is intended fo partial giveaways.
     * 
     * @param recipients list of addresses to send the newly minted tokens to
     */
    function mintEditions(address[] memory recipients) external onlyOwner override returns (uint256) {
        return _mintEditions(recipients);
    }

    /**
     * Simple override for owner interface.
     */
    function owner() public view override(OwnableUpgradeable, IMintableEditions) returns (address) {
        return super.owner();
    }

    /**
     * Allows the edition owner to set the amount of tokens (max 65535) an address is allowed to mint.
     * 
     * If the ZeroAddress (address(0x0)) is set as a minter with an allowance greater than 0, anyone will be allowed 
     * to mint any amount of tokens, similarly to setApprovalForAll in the ERC721 spec.
     * If the allowed amount is set to 0 then the address will NOT be allowed to mint.
     * 
     * @param minter address to set approved minting status for
     * @param allowed uint16 how many tokens this address is allowed to mint, 0 disables minting
     */
    function setApprovedMinter(address minter, uint16 allowed) public onlyOwner {
        _allowedMinters[minter] = allowed;
    }

    /**
     * Allows for updates of edition urls by the owner of the edition.
     * Only URLs can be updated (data-uris are supported), hashes cannot be updated.
     */
    function updateEditionURL(string memory contentUrl) public onlyOwner {
        _contentUrl = contentUrl;
    }

    /** 
     * Returns the number of tokens still available for minting (uint64 when open edition)
     */
    function numberCanMint() public view override returns (uint256) {
        // edition id is one-indexed
        return (_size == 0) ? type(uint64).max - 1 : _size - _counter.current() + 1;
    }

    /**
     * User burn function for token id.
     * 
     *  @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not approved");
        _burn(tokenId);
    }

    /**
     * Private function to mint without any access checks.
     * Called by the public edition minting functions.
     */
    function _mintEditions(address[] memory recipients) internal returns (uint256) {
        uint64 startAt = uint64(_counter.current());
        uint64 endAt = uint64(startAt + recipients.length - 1);
        require(_size == 0 || endAt <= _size, "Sold out");
        while (_counter.current() <= endAt) {
            _mint(recipients[_counter.current() - startAt], _counter.current());
            _counter.increment();
        }
        return _counter.current();
    }

    /**
     * Get URI and hash for edition NFT
     * @return contentUrl, contentHash
     */
    function getURI() public view returns (string memory, bytes32) {
        return (_contentUrl, _contentHash);
    }

    /**
     * Get URI for given token id
     * 
     * @param tokenId token id to get uri for
     * @return base64-encoded json metadata object
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "No token");
        return _metadata.createTokenURI(name(), _description, _contentUrl, _contentType, tokenId, _size);
    }
    
     /**
      * ERC2981 - Gets royalty information for token
      * @param _value the sale price for this token
      */
    function royaltyInfo(uint256, uint256 _value) external view override returns (address receiver, uint256 royaltyAmount) {
        if (owner() == address(0x0)) {
            return (owner(), 0);
        }
        return (owner(), (_value * _royalties) / 10_000);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, IERC165Upgradeable) returns (bool) {
        return type(IERC2981Upgradeable).interfaceId == interfaceId || ERC721Upgradeable.supportsInterface(interfaceId);
    }
}

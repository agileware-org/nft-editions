░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░░█▄░█▒█▀░▀█▀░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀ ▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▒▀█░█▀░▒█▒▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██

---

Solidity smart contracts implementing ERC721 with multiple editions.

# Properties

Instances of this contract can be obtained by using the `createEdition` operation on the `EditionFactory` contract, with a substantial saving in gas.

Each edition has the following characteristics:

* `name` (IMMUTABLE) can be considered the title for the edition
* `symbol` (IMMUTABLE) is the symbol associated with the tokens
* `description` (IMMUTABLE) can be used to describe the edition to the public
* `contentUrl` is used to associate some off-chain content, edition creator can update
* `contentHash` (IMMUTABLE) sha256 of the associated content 
* `editionSize` (IMMUTABLE) determines how many NFTs of this edition can be minted: if set to 0 a total of `18,446,744,073,709,551,615` can be minted
* `royaltiesBPS` (IMMUTABLE) perpetual royalties to be paid to the token creator upon any reselling, in `1/10.000` format (eq. `2.5%` corresponding to a value of `250`)

Almost all the properties are immutable, with the exclusion of the `contentUrl`, allowing the edition creator to move the content if necessary.

The contract guarantees minting is automatically disabled upon minting of the last available NFT: an edition can never generate more NFTs than `editionSize`. 

# Capabilities

## Creator
The contract is quite flexible and allows the edition's creator to:

* mint and transfer NFTs to a list of addresses (one NFT per address), allowing for partial giveaways (creator pays minting gas)
* permit limited minting (from `1` up to `65,535` NFTs) to a list of third parties, allowing for rewarding (creator pays permission granting gas, third party pays minting gas)
* permit minting to anyone, allowing for public giveaways (third party pays minting gas)
* establish a sale price, allowing for public sale (third party pays minting gas plus sale value)
* at any time, the creator can withdraw any amount of ETH collected by the edition from sales

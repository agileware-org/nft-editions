░█▄█░▄▀▄▒█▀▒▄▀▄░░░▒░░░░█▄░█▒█▀░▀█▀░░▒██▀░█▀▄░█░▀█▀░█░▄▀▄░█▄░█░▄▀▀ 
▒█▒█░▀▄▀░█▀░█▀█▒░░▀▀▒░░█▒▀█░█▀░▒█▒▒░░█▄▄▒█▄▀░█░▒█▒░█░▀▄▀░█▒▀█▒▄██

---

Solidity smart contracts implementing ERC721 with multiple editions.

# Properties

Instances of this contract can be obtained by using the `createEdition` operation on the `MintableEditionsFactory` contract, with a substantial saving in gas.

Each `MintableEditions` produced has the following characteristics:

* `name` (IMMUTABLE) can be considered the title for the editions produced
* `symbol` (IMMUTABLE) is the symbol associated with the tokens
* `description` (IMMUTABLE) can be used to describe the edition to the public
* `contentUrl` is used to associate some off-chain content, the contract owner can update
* `contentHash` (IMMUTABLE) sha256 of the associated off-chain content
* `size` (IMMUTABLE) determines how many NFTs of this edition can be minted: if set to 0 then `uint64.max()` tokens can be minted (about _18.5 **quintillions**_)
* `royalties` (IMMUTABLE) perpetual royalties to be paid to the token owner upon any reselling, in [basis-points](https://www.investopedia.com/terms/b/basispoint.asp) format (eq. `250` corresponding to **2.5%**)
* `shareholders` (IMMUTABLE) any value collected by this contract sales will be splitted between the shareholders and the owner
* `shares` (IMMUTABLE) one entry per each shareholder, determines how many shares (in [basis-points](https://www.investopedia.com/terms/b/basispoint.asp)) the same-index shareholder will receive

Almost all the properties are immutable, with the exclusion of the `contentUrl`, allowing the edition owner to move the content, if necessary.

The contract guarantees minting is automatically disabled when the last available NFT is produced: an edition can never generate 
more NFTs than `size`, or `18,446,744,073,709,551,615` if `size` is zero.

# Capabilities

## Roles

The following are the roles available on the contract:

* the `owner`, also referenced as _the artist_, is the **creator** of the edition contract, unless ownership is transferrred
* the `minters` are those allowed for minting, in case the zero-address is added among the allowed minters _anyone_ can be considered a _minter_
* the `buyer` is anyone who mints a token through the `purchase()` operation
* the `shareholders` are those receving shares of the contract balance upon withdrawal

At any time, anyone can issue a `withdrawal()`, but only the contract owner and the shareholders will receive their shares of the current contract balance. The action can be repeated for partial payouts.

## Owner

The contract is quite flexible and allows the editions _owner_ to:

* mint for himself
* mint and transfer NFTs to a list of addresses (one NFT per address), allowing for partial giveaways (owner pays minting gas)
* permit limited minting (from `1` up to `65,535` NFTs) to a list of third parties, allowing for rewarding (owner pays gas for permission granting, third party pays minting gas)
* permit minting to anyone, allowing for unlimited public giveaways (third party pays minting gas)
* establish a sale price, allowing for public sales (third party pays minting gas plus sale price)
* transfer ownership to someone else along with the royalties on previous and future editions and any sale shares of the previous owner

# Addresses

| network  | contract                | address                                      |
|:--------:|------------------------:|----------------------------------------------|
| rinkeby  | EditionMetadata         | `0x5977B72586a66d91843A62b33498e73cdCB9e1A7` |
| rinkeby  | MintableEditions        | `0x01659C7edB88e82aF84cF308Fd292b0bdB0a7A92` |
| rinkeby  | MintableEditionsFactory | `0x9941CcF22801c4BEe905fa3f892AC1E6FbC5B60F` |
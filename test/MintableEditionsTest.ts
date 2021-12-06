const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintableEditionsFactory,
  MintableEditions,
} from "../typechain";

describe("MintableEditions", function () {
  let artist: SignerWithAddress;
  let shareholder: SignerWithAddress;
  let buyer: SignerWithAddress;
  let minter: SignerWithAddress;
  let receiver: SignerWithAddress;
  let purchaser: SignerWithAddress;
  let editions: MintableEditions;
  
  
  beforeEach(async () => {
    [artist, shareholder, buyer, minter, receiver, purchaser] = await ethers.getSigners();
    const { MintableEditionsFactory } = await deployments.fixture(["Editions"]);
    const factory = (await ethers.getContractAt("MintableEditionsFactory", MintableEditionsFactory.address)) as MintableEditionsFactory;
    const receipt = await (await factory.create(
      "Roberto Lo Giacco",
      "RLG",
      "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
      "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
      "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
      "",
      2500,
      150,
      [{holder: (await shareholder.getAddress()) as string, bps: 500}]
    )).wait();
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        editions = (await ethers.getContractAt("MintableEditions", event.args![4])) as MintableEditions;
        await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
      }
    }
  });

  it("Artist can mint for self", async function () {
    editions.connect(artist);
    await expect(editions.mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, artist.address, 1);

    const artistBalance = await editions.balanceOf(artist.address);
    await expect(await editions.totalSupply()).to.equal(artistBalance);
  });

  it("Artist can mint for someone", async function () {
    editions.connect(artist);
    await expect(editions.mintAndTransfer([receiver.address]))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 1);

    const receiverBalance = await editions.balanceOf(receiver.address);
    await expect(await editions.totalSupply()).to.equal(receiverBalance);
  });

  it("Artist can mint for others", async function () {
    editions.connect(artist);
    let recipients = new Array<string>(10);
    for (let i = 0; i < recipients.length; i++) {
      recipients[i] = receiver.address;
    }
    await expect(editions.mintAndTransfer(recipients))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 1);
    const receiverBalance = await editions.balanceOf(receiver.address);
    await expect(await editions.totalSupply()).to.equal(receiverBalance);
  });

  it("Artist only can allow minters", async function () {
    editions.connect(artist);
    await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
    await expect(editions.connect(minter).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Artist only can revoke allowed minters", async function () {
    editions.connect(artist);
    await editions.setApprovedMinters([{minter: minter.address, amount: 0}]);
    await expect(editions.connect(minter).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
 
  });
  

  it("Artist only can reduce/increase allowances to minters", async function () {
    editions.connect(artist);
    await editions.setApprovedMinters([{minter: minter.address, amount: 51}]);
    await expect(editions.connect(minter).setApprovedMinters([{minter: minter.address, amount: 39}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setApprovedMinters([{minter: minter.address, amount: 2}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setApprovedMinters([{minter: minter.address, amount: 60}])).to.be.revertedWith("Ownable: caller is not the owner");

  });

  it("Artist only can set sale price", async function () {
    await expect(editions.setPrice(ethers.utils.parseEther("1.0")))
      .to.emit(editions, "PriceChanged")
      .withArgs(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(minter).setPrice(ethers.utils.parseEther("1.0"))).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setPrice(ethers.utils.parseEther("1.0"))).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setPrice(ethers.utils.parseEther("1.0"))).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Allowed minter can mint for self", async function () {
    await expect(editions.connect(minter).mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, minter.address, 1);
    const minterBalance = await editions.balanceOf(minter.address);
    await expect(await editions.totalSupply()).to.equal(minterBalance);
  });

  it("Allowed minter can mint for someone", async function () {
    await expect(editions.connect(minter).mintAndTransfer([receiver.address]))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 1);
    const receiverBalance = await editions.balanceOf(receiver.address);
    await expect(await editions.totalSupply()).to.equal(receiverBalance);
  });

  it("Allowed minter can mint for others within limits", async function () {
    let recipients = new Array<string>(50);
    for (let i = 0; i < recipients.length; i++) {
      recipients[i] = receiver.address;
    }
    await expect(editions.connect(minter).mintAndTransfer(recipients))
      .to.emit(editions, "Transfer");
    const receiverBalance = await editions.balanceOf(receiver.address);
    await expect(await editions.totalSupply()).to.equal(receiverBalance);
  });

  it("Allowed minter cannot exceed his allowance", async function () {
    let recipients = new Array<string>(51);
    for (let i = 0; i < recipients.length; i++) {
      recipients[i] = receiver.address;
    }
    await expect(editions.connect(minter).mintAndTransfer(recipients))
      .to.be.revertedWith("Allowance exceeded");
  });
  
   it("Revoked minters cannot mint for self or others", async function () {
    editions.connect(artist);
    await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
    await editions.setApprovedMinters([{minter: minter.address, amount: 0}]);
    await expect(editions.connect(minter).mint()).to.be.revertedWith("Minting not allowed");
    await expect(editions.connect(minter).mintAndTransfer([receiver.address])).to.be.revertedWith("Minting not allowed");   
    await expect(await editions.totalSupply()).to.be.equal(0);

  });
  
  it("Anyone can mint without limit when zero address is allowed for minting", async function () {
    editions.connect(artist);
    await editions.setApprovedMinters([{minter: ethers.constants.AddressZero, amount: 1}]);
    await expect(editions.connect(minter).mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, minter.address, 1);
      await expect(editions.connect(minter).mintAndTransfer([receiver.address]))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 2);
      await expect(editions.connect(purchaser).mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, purchaser.address, 3);
      await expect(editions.connect(receiver).mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 4);
    await expect(await editions.totalSupply()).to.be.equal(4);
  });

  it("Anyone can purchase at sale price", async function () {
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, purchaser.address, 1);
    const purchaserBalance = await editions.balanceOf(purchaser.address);
    await expect(await editions.totalSupply()).to.equal(purchaserBalance);
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
  });

  it("Purchases are rejected when value is incorrect", async function () {
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(artist).purchase({value: ethers.utils.parseEther("1.0001")}))
    .to.be.revertedWith("Wrong price");
    await expect(editions.connect(minter).purchase({value: ethers.utils.parseEther("0.9999")}))
    .to.be.revertedWith("Wrong price");
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("0.0001")}))
    .to.be.revertedWith("Wrong price");
  });

  it("Purchases are disallowed when price is set to zero", async function () {
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
    .to.be.revertedWith("Not for sale");
  });

/* WIP andrea, unexpected error
  it("Artist only can update content URL, but only to non empty value", async function () { 
    editions.connect(artist);
    await editions.updateEditionsURLs([{ _contentUrl: "https://ipfs.io/ipfs/newContenturl" , _thumbnailUrl: "https://ipfs.io/ipfs/newThumbnailurl" }]);
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/newContentUrl");
    expect(await editions.thumbnailUrl()).to.be.equal("https://ipfs.io/ipfs/newThumbnailUrl");
    await expect(editions.connect(minter).updateEditionsURLs([{_contentUrl: "https://ipfs.io/ipfs/newContentUrl2", _thumbnailUrl: "https://ipfs.io/ipfs/newThumbnailUrl2"}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).updateEditionsURLs([{_contentUrl: "https://ipfs.io/ipfs/newContentUrl2", _thumbnailUrl: "https://ipfs.io/ipfs/newThumbnailUrl2"}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).updateEditionsURLs([{_contentUrl: "https://ipfs.io/ipfs/newContentUrl2", _thumbnailUrl: "https://ipfs.io/ipfs/newThumbnailUrl2"}])).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/newContentUrl");
    expect(await editions.thumbnailUrl()).to.be.equal("https://ipfs.io/ipfs/newThumbnailUrl");
    editions.connect(artist);
    expect(await editions.updateEditionsURLs([{_contentUrl: "", _thumbnailUrl: "https://ipfs.io/ipfs/newThumbnailUrl"}])).to.be.revertedWith("Empty content URL");
  
  });
*/
  it("Artist only can update thumbnail URL, also to empty value", async function () { 
    expect.fail('Not implemented');
  });

  it("Artist only can approveForAll", async function () { 
    expect.fail('Not implemented');
  });

  it("Artist can withdraw its shares", async function () { 
    expect.fail('Not implemented');
  });

  it("Artist without pending payment cannot withdraw", async function () { 
    expect.fail('Not implemented');
  });

  it("Artist withdrawing multiple times respect its global shares", async function () { 
    expect.fail('Not implemented');
  });

  it("Shareholders can withdraw their shares", async function () { 
    expect.fail('Not implemented');
  });

  it("Shareholders without pending payment cannot withdraw", async function () { 
    expect.fail('Not implemented');
  });

  it("Shareholders withdrawing multiple times respect their global shares", async function () { 
    expect.fail('Not implemented');
  });

  it("Artist and shareholders only can withdraw", async function () { 
    expect.fail('Not implemented');
  });

  it("Anyone can shake the contract", async function () { 
    expect.fail('Not implemented');
  });

  it("ERC-721: totalSupply increases upon minting", async function () { 
    expect.fail('Not implemented');
  });

  it("ERC-721: token ownership", async function () { 
    expect.fail('Not implemented');
  });

  it("ERC-721: token approval", async function () { 
    expect.fail('Not implemented');
  });

  it("ERC-721: token burn", async function () { 
    expect.fail('Not implemented');
  });
  
  it("ERC-721: token URI (static content)", async function () { 
    expect.fail('Not implemented');
  });
  
  it("ERC-721: token URI (animated content)", async function () { 
    expect.fail('Not implemented');
  });
  
  it("ERC-2981: royaltyInfo", async function () { 
    expect.fail('Not implemented');
  });
});

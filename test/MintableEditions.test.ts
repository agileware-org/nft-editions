const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintableEditionsFactory,
  MintableEditions,
} from "../src/types";

describe("MintableEditions", function () {
  let artist: SignerWithAddress;
  let curator: SignerWithAddress;
  let shareholder: SignerWithAddress;
  let buyer: SignerWithAddress;
  let minter: SignerWithAddress;
  let receiver: SignerWithAddress;
  let purchaser: SignerWithAddress;
  let editions: MintableEditions;
  let factory: MintableEditionsFactory;
  
  
  beforeEach(async () => {
    [artist, curator, shareholder, buyer, minter, receiver, purchaser] = await ethers.getSigners();
    const { MintableEditionsFactory } = await deployments.fixture(["Editions"]);
    factory = (await ethers.getContractAt("MintableEditionsFactory", MintableEditionsFactory.address)) as MintableEditionsFactory;
    const receipt = await (await factory.connect(artist).create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
        contentUrl: "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      2500,
      0,
      150,
      [{holder: (await curator.getAddress()) as string, bps: 1000}, {holder: (await shareholder.getAddress()) as string, bps: 500}],
      [{minter: minter.address, amount: 50}]
    )).wait();
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        editions = (await ethers.getContractAt("MintableEditions", event.args![4])) as MintableEditions;
      }
    }
  });

  it("Artist shares are calculated correctly", async function () {
    expect(await editions.shares(await artist.getAddress())).to.be.equal(8500);
  });

  it("Artist can mint for self", async function () {
    await expect(editions.mint())
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, artist.address, 1);

    const artistBalance = await editions.balanceOf(artist.address);
    await expect(await editions.totalSupply()).to.equal(artistBalance);
  });

  it("Artist can mint for someone", async function () {
    await expect(editions.mintAndTransfer([receiver.address]))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, receiver.address, 1);

    const receiverBalance = await editions.balanceOf(receiver.address);
    await expect(await editions.totalSupply()).to.equal(receiverBalance);
  });

  it("Artist can mint for others", async function () {
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
    await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
    await expect(editions.connect(minter).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setApprovedMinters([{minter: minter.address, amount: 50}])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Artist only can revoke allowed minters", async function () {
    await editions.setApprovedMinters([{minter: minter.address, amount: 0}]);
    await expect(editions.connect(minter).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).setApprovedMinters([{minter: minter.address, amount: 0}])).to.be.revertedWith("Ownable: caller is not the owner");
 
  });

  it("Artist only can reduce/increase allowances to minters", async function () {
    expect(await editions.allowedMinters(minter.address)).to.be.equal(50);
    await editions.setApprovedMinters([{minter: minter.address, amount: 10}]);
    expect(await editions.allowedMinters(minter.address)).to.be.equal(10);
    await editions.setApprovedMinters([{minter: minter.address, amount: 51}]);
    expect(await editions.allowedMinters(minter.address)).to.be.equal(51);
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
    await editions.setApprovedMinters([{minter: minter.address, amount: 50}]);
    await expect(editions.connect(minter).mint()).to.emit(editions, "Transfer");
    await expect(await editions.totalSupply()).to.be.equal(1);

    await editions.setApprovedMinters([{minter: minter.address, amount: 0}]);
    await expect(editions.connect(minter).mint()).to.be.revertedWith("Minting not allowed");
    await expect(editions.connect(minter).mintAndTransfer([receiver.address])).to.be.revertedWith("Minting not allowed");
    await expect(await editions.totalSupply()).to.be.equal(1);
  });
  
  it("Anyone can mint without limit when zero address is allowed for minting", async function () {
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

    for (let i = 0; i < 10; i++) {
      await expect(editions.connect(buyer).mint()).to.emit(editions, "Transfer");
    }
    expect(await editions.totalSupply()).to.be.equal(14);
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
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
      .to.emit(editions, "Transfer");

    await editions.setPrice(ethers.utils.parseEther("0.0"));
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
      .to.be.revertedWith("Not for sale");
  });

 it("Artist only can update content URL, but only to non empty value", async function () { 
    await editions.updateEditionsURLs("https://ipfs.io/ipfs/newContentUrl" , "https://ipfs.io/ipfs/newThumbnailUrl");
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/newContentUrl");
    expect(await editions.thumbnailUrl()).to.be.equal("https://ipfs.io/ipfs/newThumbnailUrl");
    await expect(editions.connect(minter).updateEditionsURLs("https://ipfs.io/ipfs/newContentUrl2",  "https://ipfs.io/ipfs/newThumbnailUrl2")).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).updateEditionsURLs( "https://ipfs.io/ipfs/newContentUrl2",  "https://ipfs.io/ipfs/newThumbnailUrl2")).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).updateEditionsURLs("https://ipfs.io/ipfs/newContentUrl2", "https://ipfs.io/ipfs/newThumbnailUrl2")).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/newContentUrl");
    expect(await editions.thumbnailUrl()).to.be.equal("https://ipfs.io/ipfs/newThumbnailUrl");

    await expect(editions.updateEditionsURLs("", "https://ipfs.io/ipfs/newThumbnailUrl")).to.be.revertedWith("Empty content URL");
    
  });
  
  it("Artist only can update thumbnail URL, also to empty value", async function () { 
    await editions.updateEditionsURLs("ipfs://content", "ipfs://thumbnail");
    await expect(await editions.thumbnailUrl()).to.be.equal("ipfs://thumbnail");
    
    await expect(editions.connect(minter).updateEditionsURLs("ipfs://content", "ipfs://thumbnail"))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(receiver).updateEditionsURLs("ipfs://content", "ipfs://thumbnail"))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(editions.connect(purchaser).updateEditionsURLs("ipfs://content", ""))
      .to.be.revertedWith("Ownable: caller is not the owner");
    
    await editions.updateEditionsURLs("ipfs://content.new", "");
    await expect(await editions.thumbnailUrl()).to.be.equal("");
  });

  it("Artist can withdraw its shares", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
    
    const before = await artist.getBalance();
    await expect(editions.withdraw())
      .to.emit(editions, "SharesPaid")
      .withArgs(artist.address, ethers.utils.parseEther(".85"));
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.15"));
    await expect((await artist.getBalance()).sub(before))
      .to.be.within(ethers.utils.parseEther("0.84"), ethers.utils.parseEther("0.85"));
  });

  it("Artist without pending payment cannot withdraw", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(artist).withdraw()).to.be.revertedWith("Account is not due payment");

    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await expect(editions.connect(artist).withdraw());
    await expect(editions.connect(artist).withdraw()).to.be.revertedWith("Account is not due payment");
  });

  it("Artist withdrawing multiple times respect its global shares", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    const before = await artist.getBalance();

    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await editions.connect(artist).withdraw();
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.15"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await editions.connect(artist).withdraw();
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.30"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await editions.connect(artist).withdraw();
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.45"));
  });

  it("Shareholders can withdraw their shares", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});

    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
    const before = await shareholder.getBalance();

    await expect(editions.connect(shareholder).withdraw())
      .to.emit(editions, "SharesPaid")
      .withArgs(shareholder.address, ethers.utils.parseEther(".05"));
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.95"));
    await expect((await shareholder.getBalance()).sub(before))
      .to.be.within(ethers.utils.parseEther("0.04"), ethers.utils.parseEther("0.05"));
  });

  it("Shareholders without pending payment cannot withdraw", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(shareholder).withdraw()).to.be.revertedWith("Account is not due payment");

    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await expect(editions.connect(shareholder).withdraw());
    await expect(editions.connect(shareholder).withdraw()).to.be.revertedWith("Account is not due payment");
  });

  it("Shareholders withdrawing multiple times respect their global shares", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));

    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await editions.connect(shareholder).withdraw();
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.95"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await expect(editions.connect(shareholder).withdraw()).to.changeEtherBalance;
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.90"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});
    await editions.connect(shareholder).withdraw();
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("2.85"));
  });

  it("Artist and shareholders only can withdraw", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});

    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(minter).withdraw()).to.be.revertedWith("Account is not due payment");
    await expect(editions.connect(purchaser).withdraw()).to.be.revertedWith("Account is not due payment");
    await expect(editions.connect(receiver).withdraw()).to.be.revertedWith("Account is not due payment");
    await expect(editions.connect(buyer).withdraw()).to.be.revertedWith("Account is not due payment");
    await expect(await editions.connect(shareholder).withdraw())
      .to.changeEtherBalance(shareholder, ethers.utils.parseEther(".05"));
    await expect(await editions.connect(artist).withdraw())
      .to.changeEtherBalance(artist, ethers.utils.parseEther(".85"));
    await expect(await editions.connect(curator).withdraw())
      .to.changeEtherBalance(curator, ethers.utils.parseEther(".10"));
    
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.0"));
  });

  it("Anyone can shake the contract", async function () { 
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")});

    await expect(editions.connect(purchaser).shake())
      .to.emit(editions, "SharesPaid")
      .withArgs(shareholder.address, ethers.utils.parseEther(".05"))
      .and.to.emit(editions, "SharesPaid")
      .withArgs(curator.address, ethers.utils.parseEther(".10"))
      .and.to.emit(editions, "SharesPaid")
      .withArgs(artist.address, ethers.utils.parseEther(".85"));

    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("0.0"));
  });

  it("ERC-721: totalSupply increases upon minting", async function () {
    await expect(await editions.totalSupply()).to.be.equal(0);
    await editions.connect(minter).mint();
    await expect(await editions.totalSupply()).to.be.equal(1);
    await editions.connect(artist).mint();
    await editions.connect(minter).mintAndTransfer([receiver.address, receiver.address]);
    await expect(await editions.totalSupply()).to.be.equal(4);
  });

  it("ERC-721: token ownership", async function () { 
    await editions.connect(minter).mint();
    await expect(await editions.ownerOf(1)).to.be.equal(minter.address);

    await expect(editions.ownerOf(2))
      .to.be.revertedWith("ERC721: owner query for nonexistent token");
    await editions.connect(artist).mint();
    await expect(await editions.ownerOf(2)).to.be.equal(artist.address);
  });

  it("ERC-721: token approve", async function () {
    await editions.connect(minter).mint();
    await editions.connect(minter).mint();
    
    await expect(editions.connect(artist).approve(minter.address, 1))
      .to.be.revertedWith("ERC721: approval to current owner");

    await expect(editions.connect(artist).approve(receiver.address, 1))
      .to.be.revertedWith("ERC721: approve caller is not owner nor approved for all");
    
    await expect(editions.connect(minter).approve(receiver.address, 2))
      .to.emit(editions, "Approval")
      .withArgs(minter.address, receiver.address, 2);

    await expect(editions.connect(minter).approve(receiver.address, 3))
      .to.be.revertedWith("ERC721: owner query for nonexistent token");
  });

  it("ERC-721: token approveForAll", async function () { 
    await editions.connect(minter).mint();
    
    await expect(editions.connect(minter).setApprovalForAll(receiver.address, true))
      .to.emit(editions, "ApprovalForAll")
      .withArgs(minter.address, receiver.address, true);
    
    await editions.connect(minter).mint();

    await expect(editions.connect(receiver).transferFrom(minter.address, purchaser.address, 1))
      .to.emit(editions, "Transfer")
      .withArgs(minter.address, purchaser.address, 1);
    
    await expect(editions.connect(artist).transferFrom(minter.address, purchaser.address, 1))
      .to.be.revertedWith("ERC721: transfer caller is not owner nor approved");

    await expect(editions.connect(receiver).transferFrom(minter.address, curator.address, 2))
      .to.emit(editions, "Transfer")
      .withArgs(minter.address, curator.address, 2);

    await expect(await editions.totalSupply()).to.be.equal(2);
  });


  it("ERC-721: token burn", async function () { 
    await editions.connect(minter).mint();
    await expect(editions.connect(artist).burn(1)).to.be.revertedWith("Not approved");
    await expect(editions.connect(minter).burn(1));
  });
  
  it("ERC-721: token URI (static content)", async function () { 
    const receipt = await (await factory.connect(artist).create(
      {
        name: "Roberto",
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x05db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      500,
      0,
      150,
      [],
      [])).wait();
    let contract:MintableEditions;
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        contract = (await ethers.getContractAt("MintableEditions", event.args![4])) as MintableEditions;
      }
    }
    await contract!.connect(artist).mint();
    const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');
    expect(await contract!.tokenURI(1))
      .to.be.equal("data:application/json;base64," + encode('{"name":"Roberto 1/500","description":"**Me**, _myself_ and I.","image":"ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d?id=1","properties":{"number":1,"name":"Roberto"}}'));
  });
  
  it("ERC-721: token URI (animated content)", async function () { 
    const receipt = await (await factory.connect(artist).create(
      {
        name: "Roberto", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x05db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [],
      [])).wait();
    let contract:MintableEditions;
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        contract = (await ethers.getContractAt("MintableEditions", event.args![4])) as MintableEditions;
      }
    }
    await contract!.connect(artist).mint();
    const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');
    expect(await contract!.tokenURI(1))
      .to.be.equal("data:application/json;base64," + encode('{"name":"Roberto 1/500","description":"**Me**, _myself_ and I.","image":"https://i.imgur.com/FjT55Ou.jpg?id=1","animation_url":"ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d?id=1","properties":{"number":1,"name":"Roberto"}}'));
  });
  
  it("ERC-2981: royaltyInfo", async function () { 
    await editions.connect(minter).mint();
    expect(await editions.royaltyInfo(1, ethers.utils.parseEther("1.0")))
      .to.be.deep.equal([artist.address, ethers.utils.parseEther("0.015")])
    expect(await editions.royaltyInfo(2, ethers.utils.parseEther("1.0")))
      .to.be.deep.equal([artist.address, ethers.utils.parseEther("0.015")])
  });
});

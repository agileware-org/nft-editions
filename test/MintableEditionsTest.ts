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
        await editions.setApprovedMinter(minter.address, 50);
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

  it("Artist can allow minters", async function () {
    editions.connect(artist);
    await editions.setApprovedMinter(minter.address, 10);
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

  it("Public can purchase at sale price", async function () {
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
      .to.emit(editions, "Transfer")
      .withArgs(ethers.constants.AddressZero, purchaser.address, 1);
    const purchaserBalance = await editions.balanceOf(purchaser.address);
    await expect(await editions.totalSupply()).to.equal(purchaserBalance);
    await expect(await editions.provider.getBalance(editions.address)).to.equal(ethers.utils.parseEther("1.0"));
  });

  it("Purchase rejected for incorrect price", async function () {
    await editions.setPrice(ethers.utils.parseEther("1.0"));
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0001")}))
    .to.be.revertedWith("Wrong price");
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("0.9999")}))
    .to.be.revertedWith("Wrong price");
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("0.0001")}))
    .to.be.revertedWith("Wrong price");
  });

  it("Purchase disabled for unset price", async function () {
    await expect(editions.connect(purchaser).purchase({value: ethers.utils.parseEther("1.0")}))
    .to.be.revertedWith("Not for sale");
  });
});
require("chai").use(require('chai-as-promised'));
const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintableEditionsFactory,
  MintableEditions,
  MintableEditionsFactory__factory,
} from "../typechain";

describe("MintableEditionsFactory", function () {
  let artist: SignerWithAddress;
  let shareholder: SignerWithAddress;
  let other: SignerWithAddress;
  let factory: MintableEditionsFactory;
  
  beforeEach(async () => {
    const { MintableEditionsFactory } = await deployments.fixture(["Editions"]);
    const dynamicMintableAddress = (await deployments.get("MintableEditions")).address;
    factory = (await ethers.getContractAt("MintableEditionsFactory", MintableEditionsFactory.address)) as MintableEditionsFactory;
    [artist, shareholder, other] = await ethers.getSigners();
  });

  it("Should emit a CreatedEditions event upon create", async function () {
    expect(await factory.instances()).to.be.equal(0);
    const expectedAddress = await factory.get(0);
    await expect(factory.create(
      {
        name: "Roberto", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
        contentUrl: "https://ipfs.io/ipfs/bafybeib52yyp5jm2vwifd65mv3fdmno6dazwzyotdklpyq2sv6g2ajlgxu",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      1000,
      0,
      250,
      [{holder: (await shareholder.getAddress()), bps: 1500}],
      []))

      .to.emit(factory, "CreatedEditions");
    
    expect(await factory.instances()).to.be.equal(1);
    expect(await factory.get(0)).to.be.equal(expectedAddress);
    
  });

  it("Should produce an initialized MintableEditions instance upon create", async function () {
    const receipt = await (await factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      2500,
      ethers.utils.parseEther("1.0"),
      150,
      [{holder: (await shareholder.getAddress()), bps: 500}],
      [{minter: artist.address, amount: 100}, {minter: shareholder.address, amount: 50}]
    )).wait();

    let contractAddress = "0x0";
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        contractAddress = event.args![4];
      }
    }
    expect(contractAddress).to.not.be.equal("0x0");
    const editions = (await ethers.getContractAt("MintableEditions", contractAddress)) as MintableEditions;
    expect(await editions.name()).to.be.equal("Roberto Lo Giacco");
    expect(await editions.symbol()).to.be.equal("RLG");
    expect(await editions.description()).to.be.equal("**Me**, _myself_ and I. A gentle reminder to take care of our inner child, avoiding to take ourselves too seriously, no matter the circumstances: we are just _'a blade of grass'_. See [my website](http://www.agileware.org)");
    expect(await editions.contentUrl()).to.be.equal("https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d");
    expect(await editions.contentHash()).to.be.equal("0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc");
    expect(await editions.thumbnailUrl()).to.be.equal("");
    expect(await editions.size()).to.be.equal(2500);
    expect(await editions.royalties()).to.be.equal(150);
    expect(await editions.shares(artist.address)).to.be.equal(9500);
    expect(await editions.shares(shareholder.address)).to.be.equal(500);
    expect(await editions.mintable()).to.be.equal(2500);
    expect(await editions.price()).to.be.equal(ethers.utils.parseEther("1.0"));
    expect(await editions.totalSupply()).to.be.equal(0);
    expect(await editions.allowedMinters(artist.address)).to.be.equal(100);
    expect(await editions.allowedMinters(shareholder.address)).to.be.equal(50);
  });

  it("Should reject creation for an already minted content", async function () {
    const receipt = await (await factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "ipfs://QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      2500,
      0,
      150,
      [],
      []
    )).wait();

    let contractAddress = "0x0";
    for (const event of receipt.events!) {
      if (event.event === "CreatedEditions") {
        contractAddress = event.args![4];
      }
    }
    await expect(contractAddress).to.not.be.equal("0x0");
    await expect(factory.connect(other).create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      2500,
      0,
      150,
      [],
      []
    )).to.be.revertedWith("Duplicated content");
  });

  it("Should accept creation with no royalties", async function () {
    await factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      1000,
      0,
      0,
      [],
      []
    );
    const editions = (await ethers.getContractAt("MintableEditions", await factory.get(0))) as MintableEditions;
    await expect(await editions.royalties()).to.be.equal(0x0);
  });
  
  it("Should reject creation for invalid royalties", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      100,
      0,
      10000,
      [],
      []
    )).to.be.revertedWith("Royalties too high");
  });

  it("Should accept creation with multiple shareholders", async function () {
    await factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      0,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 1000}, {holder: (await other.getAddress()), bps: 500}],
      []
    );
    const editions = (await ethers.getContractAt("MintableEditions", await factory.get(0))) as MintableEditions;
  });

  it("Should reject creation with duplicated shareholders", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 1000}, {holder: (await shareholder.getAddress()), bps: 500}],
      []
    )).to.be.revertedWith("Shareholder already has shares");
  });

  it("Should reject creation with artist among shareholders", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 1000}, {holder: (await artist.getAddress()), bps: 500}],
      []
    )).to.be.revertedWith("Shareholder already has shares");
  });

  it("Should reject creation with zero-address among shareholders", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [{holder: ethers.constants.AddressZero, bps: 1000}, {holder: (await artist.getAddress()), bps: 500}],
      []
    )).to.be.revertedWith("Shareholder is zero address");
  });

  it("Should reject creation with a shares sum above 100%", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 9000}, {holder: (await artist.getAddress()), bps: 1500}],
      []
    )).to.be.revertedWith("Shares too high");
  });

  it("Should reject creation with 0% shares", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 0}, {holder: (await artist.getAddress()), bps: 500}],
      []
    )).to.be.revertedWith("Shares are invalid");
  });

  it("Should reject creation with shares above 100%", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: "https://i.imgur.com/FjT55Ou.jpg"
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 11000}],
      []
    )).to.be.revertedWith("Shares are invalid");
  });

  it("Should reject creation without contentUrl", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "",
        contentHash: "0x04db57416b770a06b3b2123531e68d67e9d96872f453fa77bc413e9e53fc1bfc",
        thumbnailUrl: ""
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 1000}],
      []
    )).to.be.revertedWith("Empty content URL");
  });

  it("Should reject creation without contentHash", async function () {
    await expect(factory.create(
      {
        name: "Roberto Lo Giacco", 
        symbol: "RLG",
        description: "**Me**, _myself_ and I.",
        contentUrl: "https://ipfs.io/ipfs/QmYMj2yraaBch5AoBTEjvLFdoT3ULKs4i4Ev7vte72627d",
        contentHash: "",
        thumbnailUrl: ""
      },
      500,
      0,
      150,
      [{holder: (await shareholder.getAddress()), bps: 1000}],
      []
    )).to.be.rejectedWith(Error, 'INVALID_ARGUMENT');
  });
});

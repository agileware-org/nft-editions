import "@nomiclabs/hardhat-ethers";

import {PushSplitter, ShakeableSplitter, SplitterFactory, SplitterFactory__factory} from '../src/types';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BytesLike } from "@ethersproject/bytes";

const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");

describe.only('The SplitterFactory', () => {
	let factory: SplitterFactory;
	let factoryAddress: string;
	let deployer: SignerWithAddress;
	let someone: SignerWithAddress;
	let shareholder1: SignerWithAddress;
	let shareholder2: SignerWithAddress;
	let shareholder3: SignerWithAddress;
	let sender: SignerWithAddress;
  let push:BytesLike;
  let shake:BytesLike;
	
	before(async () => {
		[deployer, someone, shareholder1, shareholder2, shareholder3, sender] = await ethers.getSigners(); // test wallets
    factoryAddress = (await deployments.get("SplitterFactory")).address; // factory address as deployed by --deploy-fixture
		factory = SplitterFactory__factory.connect(factoryAddress, deployer);
    push = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("push"))
    shake = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("shake"))
    await factory.addSplitterType(push, (await deployments.get("PushSplitter")).address);
    await factory.addSplitterType(shake, (await deployments.get("ShakeableSplitter")).address);
		//await factory.grantRole(await factory.ARTIST_ROLE(), artist.address);
	});

  it("Should emit a CreatedSplitter event upon create", async function () {
    expect(await factory.instances()).to.be.equal(0);
    const expectedAddress = await factory.get(push, 0);
    await expect(factory.connect(someone)
      .create(push, [{payee: shareholder1.address, bps: 2500},{payee: shareholder2.address, bps: 2500},{payee: shareholder3.address, bps: 5000}]))
      .to.emit(factory, "CreatedSplitter");
    
    expect(await factory.instances()).to.be.equal(1);
    expect(await factory.get(push, 0)).to.be.equal(expectedAddress);
  });

  it("Should be able to distinguish types", async function () {
    expect(await factory.get(shake, 1)).not.to.be.equal(await factory.get(push, 1))
  });

  it("Should be able to create multiple types", async function () {
    expect(await factory.instances()).to.be.equal(1);
    const shakeAddress = await factory.get(shake, 1);
    const pushAddress = await factory.get(push, 2);
    expect(await factory.get(shake, 2)).not.to.be.equal(pushAddress);

    await expect(factory.connect(someone)
      .create(shake, [{payee: shareholder1.address, bps: 2500},{payee: shareholder2.address, bps: 2500},{payee: shareholder3.address, bps: 5000}]))
      .to.emit(factory, "CreatedSplitter");
    await expect(factory.connect(someone)
      .create(push, [{payee: shareholder1.address, bps: 2500},{payee: shareholder2.address, bps: 2500},{payee: shareholder3.address, bps: 5000}]))
      .to.emit(factory, "CreatedSplitter");
    
    expect(await factory.instances()).to.be.equal(3);
    expect(await factory.get(shake, 1)).to.be.equal(shakeAddress);
    expect(await factory.get(push, 2)).to.be.equal(pushAddress);
  });

  describe('The created PushSplitter', () => {
    it("Should forward payments automatically", async function () {
      const receipt = await(await factory.connect(someone)
        .create(push, [{payee: shareholder1.address, bps: 1500},{payee: shareholder2.address, bps: 3500},{payee: shareholder3.address, bps: 5000}]))
        .wait();
      
      let contractAddress = "0x0";
      for (const event of receipt.events!) {
        if (event.event === "CreatedSplitter") {
          contractAddress = event.args![2];
        }
      }
      expect(contractAddress).to.not.be.equal("0x0");
      const splitter = (await ethers.getContractAt("PushSplitter", contractAddress)) as PushSplitter;
      await expect(await sender.sendTransaction({to: splitter.address, value: ethers.utils.parseEther("1.0")}))
      .to.changeEtherBalances(
        [sender, shareholder1, shareholder2, shareholder3, splitter], 
        [ethers.utils.parseEther("-1.0"), ethers.utils.parseEther(".15"), ethers.utils.parseEther(".35"), ethers.utils.parseEther(".50"), ethers.utils.parseEther("0")]);
    });
  });

  describe('The created ShakeableSplitter', () => {
    let splitter:ShakeableSplitter;

    it("Should hold payments", async function () {
      const receipt = await(await factory.connect(someone)
        .create(shake, [{payee: shareholder1.address, bps: 1500},{payee: shareholder2.address, bps: 3500},{payee: shareholder3.address, bps: 5000}]))
        .wait();
      
      let contractAddress = "0x0";
      for (const event of receipt.events!) {
        if (event.event === "CreatedSplitter") {
          contractAddress = event.args![2];
        }
      }
      expect(contractAddress).to.not.be.equal("0x0");
      splitter = (await ethers.getContractAt("ShakeableSplitter", contractAddress)) as ShakeableSplitter;
      await expect(await sender.sendTransaction({to: splitter.address, value: ethers.utils.parseEther("1.0")})).to.changeEtherBalances(
          [sender, splitter], 
          [ethers.utils.parseEther("-1.0"), ethers.utils.parseEther("1.0")]);
    });

    it("Should allow withdrawals", async function () {
      await expect(await splitter.withdraw(shareholder1.address)).to.changeEtherBalances(
        [splitter, shareholder1], 
        [ethers.utils.parseEther("-.15"), ethers.utils.parseEther(".15")]);
      
      await expect(await splitter.withdraw(shareholder3.address)).to.changeEtherBalances(
          [splitter, shareholder3], 
          [ethers.utils.parseEther("-.50"), ethers.utils.parseEther(".50")]);
      
      await expect(await splitter.totalReleased()).to.be.equal(ethers.utils.parseEther(".65"));
    });

    it("Should allow shaking", async function () {
      await splitter.shake(); // clears the balance
      await sender.sendTransaction({to: splitter.address, value: ethers.utils.parseEther("3.0")})
      await expect(await splitter.shake()).to.changeEtherBalances(
        [splitter, shareholder1, shareholder2, shareholder3],
        [ethers.utils.parseEther("-3.0"), ethers.utils.parseEther(".45"), ethers.utils.parseEther("1.05"), ethers.utils.parseEther("1.50")]);

    });
  });
});

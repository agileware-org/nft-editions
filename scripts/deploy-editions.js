// scripts/deploy-my-collectible.js
const { ethers, upgrades } = require("hardhat");

async function deploy(contract) {
  console.log("Deploying " + contract + " in progress...")
  const factory = await ethers.getContractFactory(contract);
  const instance = await factory.deploy();
  await instance.deployed();
  console.log(contract + " deployed to: ", instance.address);
  return instance.address;
}

async function deployWithArgs(contract, args) {
  console.log("Deploying " + contract + " in progress...")
  const factory = await ethers.getContractFactory(contract);
  const instance = await factory.deploy(args);
  await instance.deployed();
  console.log(contract + " deployed to: ", instance.address);
  return instance.address;
}
async function deployWithProxy(contract) {
  console.log("Deploying " + contract + " in progress...")
  const factory = await ethers.getContractFactory(contract);
  const proxy = await upgrades.deployProxy(factory, [], { initializer: false, kind: 'uups' });
  await proxy.deployed();
  console.log(contract + " deployed to: ", proxy.address);
  return proxy.address;
}

async function main() {
  metadata = await deploy("EditionMetadata");
  editions = await deployWithArgs("MintableEditions", metadata);
  factory = await deployWithArgs("MintableEditionsFactory", editions);
}

main();
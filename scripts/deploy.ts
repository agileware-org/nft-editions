import { ethers, upgrades } from "hardhat";

async function deploy(contract: string) {
  console.log("Deploying " + contract + " in progress...");
  const factory = await ethers.getContractFactory(contract);
  const instance = await factory.deploy();
  await instance.deployed();
  console.log(contract + " deployed to: ", instance.address);
  return instance.address;
}

async function deployWithArgs(contract: string, args: string) {
  console.log("Deploying " + contract + " in progress...")
  const factory = await ethers.getContractFactory(contract);
  const instance = await factory.deploy(args);
  await instance.deployed();
  console.log(contract + " deployed to: ", instance.address);
  return instance.address;
}
async function deployWithProxy(contract: string) {
  console.log("Deploying " + contract + " in progress...")
  const factory = await ethers.getContractFactory(contract);
  const proxy = await upgrades.deployProxy(factory, [], { initializer: false, kind: 'uups' });
  await proxy.deployed();
  console.log(contract + " deployed to: ", proxy.address);
  return proxy.address;
}

async function main() {
  const metadata = await deploy("EditionMetadata");
  const editions = await deployWithArgs("MintableEditions", metadata);
  const factory = await deployWithArgs("MintableEditionsFactory", editions);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


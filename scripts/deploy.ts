import { deployments, getChainId } from "hardhat";
import { readFileSync, writeFileSync } from 'fs';
import { ethers } from "ethers";

const {get} = deployments;
let contracts:{[name: string]: string} = {};
let roles:{[name: string]: string} = {};

async function addressOf(contract:string) {
  const deployment = await get(contract);
  contracts[contract] = deployment.address;
}

async function main() {
  const addresses = JSON.parse(readFileSync("./src/addresses.json", "utf-8"));
  addresses[await getChainId()] = contracts;
  
  await addressOf('EditionsMetadataHelper');
  await addressOf('MintableEditions');
  await addressOf('MintableEditionsFactory');
  writeFileSync('./src/addresses.json', JSON.stringify(addresses, null, 2), {encoding: 'utf-8'});

  roles["admin"] = await ethers.constants.HashZero;
  roles["artist"] = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ARTIST_ROLE"));
  writeFileSync('./src/roles.json', JSON.stringify(roles, null, 2), {encoding: 'utf-8'});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

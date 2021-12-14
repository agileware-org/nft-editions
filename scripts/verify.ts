import { run, deployments, getChainId, ethers } from "hardhat";
import { readFileSync, writeFileSync } from 'fs';

const {get} = deployments;
let contracts:{[name: string]: string} = {};

async function verify(contract:string, args: any[]) {
  const deployment = await get(contract);
  contracts[contract] = deployment.address;
  try {  
    await run("verify:verify", {
      address: deployment.address,
      constructorArguments: args,
    })
  } catch (e) {
    console.log((e instanceof Error) ? "WARNING: " + e.message : "ERROR: " + e);
  }
}

async function main() {
  const addresses = JSON.parse(readFileSync('./src/addresses.json', 'utf-8'));
  addresses[await getChainId()] = contracts;
  
  await verify('EditionsMetadataHelper', []);
  await verify('MintableEditions', [await (await get('EditionsMetadataHelper')).address]);
  await verify('MintableEditionsFactory', [await (await get('MintableEditions')).address]);
  await verify('PushSplitter', []);
  await verify('ShakeableSplitter', []);
  await verify('SplitterFactory', [await (await get('SplitterFactory')).address]);

  writeFileSync('./src/addresses.json', JSON.stringify(addresses, null, 2), {encoding: 'utf-8'});

  const types = {
    "push": ethers.utils.keccak256(Buffer.from("push")),
    "shakeable": ethers.utils.keccak256(Buffer.from("shakeable")),
  };
  writeFileSync('./src/splitters.json', JSON.stringify(types, null, 2), {encoding: 'utf-8'});

  const roles = {
    "artist": ethers.utils.keccak256(Buffer.from("ARTIST_ROLE")),
    "admin": 0,
  };
  writeFileSync('./src/roles.json', JSON.stringify(roles, null, 2), {encoding: 'utf-8'});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
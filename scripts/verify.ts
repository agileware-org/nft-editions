import { run, deployments, getChainId } from "hardhat";
import { readFileSync, writeFileSync } from 'fs';

const {get} = deployments;

async function verify(contract:string, args: any[]) {
  const deployment = await get(contract);
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
  
  await verify('EditionsMetadataHelper', []);
  await verify('MintableEditions', [await (await get('EditionsMetadataHelper')).address]);
  await verify('MintableEditionsFactory', [await (await get('MintableEditions')).address]);
  await verify('PushSplitter', []);
  await verify('ShakeableSplitter', []);
  await verify('SplitterFactory', [await (await get('PushSplitter')).address]);
  await verify('SplitterFactory', [await (await get('ShakeableSplitter')).address]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
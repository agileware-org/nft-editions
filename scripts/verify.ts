/* eslint-disable no-process-exit */
import { run, deployments } from "hardhat";

const { get } = deployments;

async function verify(contract:string, args: any[]) {
  const deployment = await get(contract);
  try {
    await run("verify:verify", {
      address: deployment.address,
      constructorArguments: args
    });
  } catch (e) {
    console.log((e instanceof Error) ? "WARNING: " + e.message : "ERROR: " + e);
  }
}

async function main() {
  await verify("EditionsMetadataHelper", []);
  await verify("MintableEditions", [await (await get("EditionsMetadataHelper")).address]);
  await verify("MintableEditionsFactory", [await (await get("MintableEditions")).address]);
  await verify("PushSplitter", []);
  await verify("ShakeableSplitter", []);
  await verify("SplitterFactory", []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

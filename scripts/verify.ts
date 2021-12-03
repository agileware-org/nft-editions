import { run, deployments } from "hardhat";

const {get} = deployments;

async function verify(contract:string, args: any[]) {
  try {
    const deployment = await get(contract);
    await run("verify:verify", {
      address: deployment.address,
      constructorArguments: args,
    })
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await verify('EditionMetadata', []);
  await verify('MintableEditions', [await (await get('EditionMetadata')).address]);
  await verify('MintableEditionsFactory', [await (await get('MintableEditions')).address]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction, DeployResult} from 'hardhat-deploy/types';

const { deployments, getNamedAccounts } = require("hardhat");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deploy, get} = deployments;
  const {deployer} = await getNamedAccounts();
  //const signer = await ethers.getSigner();

  const push = await get('PushSplitter');
  const shakeable = await get('ShakeableSplitter');

  const Factory = await deploy('SplitterFactory', {
    from: deployer,
    log: true,
  }) as DeployResult;
};
export default func;
func.dependencies = ['PushSplitter'];
func.dependencies = ['ShakeableSplitter'];
func.tags = ['splitters'];
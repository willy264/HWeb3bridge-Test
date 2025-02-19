import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  const Token = await ethers.getContractFactory("Token"); 
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log(`Token deployed at: ${token.target}`);

  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(token.target);
  await auction.waitForDeployment();
  console.log(`Auction contract deployed at: ${auction.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

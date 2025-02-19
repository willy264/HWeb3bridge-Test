import { ethers } from "hardhat";

const AUCTION_ADDRESS = "YOUR_AUCTION_CONTRACT_ADDRESS";
const TOKEN_ADDRESS = "YOUR_TOKEN_CONTRACT_ADDRESS";

async function main() {
  const [seller, buyer1, buyer2] = await ethers.getSigners();
  const token = await ethers.getContractAt("IERC20", TOKEN_ADDRESS);
  const auction = await ethers.getContractAt("Auction", AUCTION_ADDRESS);

  const amount = ethers.parseUnits("100", 18);
  const startPrice = ethers.parseEther("5");
  const duration = 600; 

  console.log("Approving tokens...");
  await token.connect(seller).approve(AUCTION_ADDRESS, amount);
  console.log("Starting auction...");
  await auction.connect(seller).startAuction(amount, startPrice, duration);
  
  await new Promise((resolve) => setTimeout(resolve, 300000)); 
  let price = await auction.getcurrentPrice();
  console.log(`Current price after 5 minutes: ${ethers.formatEther(price)}`);

  console.log("Buyer1 purchasing...");
  await auction.connect(buyer1).buy({ value: price });

  console.log("Auction completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";

describe("Auction", function () {
  async function deployAuctionContract() {
    const [deployer, seller, buyer, other] = await hre.ethers.getSigners();
  
    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.waitForDeployment();
  
    const Auction = await hre.ethers.getContractFactory("Auction");
    const auction = await Auction.connect(seller).deploy(token.target);
    await auction.waitForDeployment();
  
    const tokensToSell = hre.ethers.parseEther("100");
    await token.connect(deployer).transfer(seller.address, tokensToSell);
  
    await token.connect(seller).approve(auction.target, tokensToSell);
  
    return { auction, token, deployer, seller, buyer, other };
  }
  
  it("should start the auction and decrease price", async function () {
    const { auction, seller, token } = await deployAuctionContract();
    const amount = hre.ethers.parseEther("10");
    const startPrice = hre.ethers.parseEther("10");
    const duration = 3600;
  
    await auction.connect(seller).startAuction(amount, startPrice, duration);
  
    expect(await auction.seller()).to.equal(seller.address);
    expect(await auction.token()).to.equal(token.target);
  });

  it("should allow only one buyer to purchase", async function () {
    const { auction, seller, buyer, other, token } = await deployAuctionContract();
    const amount = hre.ethers.parseEther("10");
    const startPrice = hre.ethers.parseEther("10");
    const duration = 3600;

    await auction.connect(seller).startAuction(amount, startPrice, duration);
    await time.increase(1800);
    const currentPrice = await auction.getcurrentPrice();

    await auction.connect(buyer).buy({ value: currentPrice });

    await expect(auction.connect(other).buy({ value: currentPrice })).to.be.revertedWith(
      "Auction already completed"
    );
  });

  it("should not allow purchase after auction ends", async function () {
    const { auction, seller, buyer } = await deployAuctionContract();
    const amount = hre.ethers.parseEther("10");
    const startPrice = hre.ethers.parseEther("10");
    const duration = 3600;

    await auction.connect(seller).startAuction(amount, startPrice, duration);
    await time.increase(4000);

    await expect(auction.connect(buyer).buy({ value: startPrice })).to.be.revertedWith("Auction expired");
  });

  it("should transfer tokens and ETH correctly", async function () {
    const { auction, token, seller, buyer } = await deployAuctionContract();
    const amount = hre.ethers.parseEther("10");
    const startPrice = hre.ethers.parseEther("10");
    const duration = 3600;

    await auction.connect(seller).startAuction(amount, startPrice, duration);
    await time.increase(1800);
    const currentPrice = await auction.getcurrentPrice();

    const sellerBalanceBefore = await hre.ethers.provider.getBalance(seller.address);
    const buyerBalanceBefore = await token.balanceOf(buyer.address);

    await auction.connect(buyer).buy({ value: currentPrice });

    const sellerBalanceAfter = await hre.ethers.provider.getBalance(seller.address);
    const buyerBalanceAfter = await token.balanceOf(buyer.address);

    expect(sellerBalanceAfter).to.be.gt(sellerBalanceBefore);
    expect(buyerBalanceAfter).to.equal(buyerBalanceBefore + amount);
  });

});

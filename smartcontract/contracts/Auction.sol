// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Auction {
    address public seller;
    IERC20 public token;
    uint256 public startPrice;
    uint256 public time;
    uint256 public duration;
    uint256 public priceDecreaseOverTime;
    uint256 public amount;
    bool public sold;
    address public buyer;

    constructor(address _token) {
        seller = msg.sender;
        token = IERC20(_token);
    }

    event AuctionStarted(address indexed seller, uint256 startPrice, uint256 duration);
    event AuctionSuccessful(address indexed buyer, uint256 price);
    event AuctionEnded();

    function startAuction(uint256 _amount, uint256 _startPrice, uint256 _duration) external {
        require(msg.sender == seller, "You are not the seller");
        require(!sold, "Auction has ended");
        require(startPrice > 0, "Start price must be greater than 0");
        require(_duration > 0, "Duration must be higher than 0");
        
        amount = _amount;
        startPrice = _startPrice;
        duration = _duration;
        time = block.timestamp;
        priceDecreaseOverTime = _startPrice / _duration;
        
        token.transferFrom(msg.sender, address(this), _amount);

        emit AuctionStarted(msg.sender, _startPrice, _duration);
    }

    function getcurrentPrice() public view returns (uint256) {
        if (block.timestamp >= (time + duration)) {
            return 0;
        }
        return startPrice - (priceDecreaseOverTime * (block.timestamp - time));
    }

    function buy() external payable {
        require(!sold, "Auction already completed");
        require(block.timestamp < (time + duration), "Auction expired");
        
        uint256 currentPrice = getcurrentPrice();
        require(msg.value >= currentPrice, "Insufficient ETH sent");
        
        sold = true;
        buyer = msg.sender;
        payable(seller).transfer(currentPrice);
        token.transfer(msg.sender, amount);
        
        emit AuctionSuccessful(msg.sender, currentPrice);
    }
}

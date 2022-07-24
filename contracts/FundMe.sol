// get funds from users
// Withdraw funds
// Set a minimum funding value in USD

// SPDX-License-Identifier: MIT
// pragma
pragma solidity ^0.8.8;
// imports
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error FundMe__NotOwner();

contract FundMe {
    // Gas Efficiency => Immutable, Constant
    using PriceConverter for uint256;
    uint256 public constant MINIMUM_USD = 10 * 1e18;

    address[] private s_funders;

    mapping(address => uint256) private s_AddressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface public s_priceFeed;

    modifier onlyowner() {
        //require(msg.sender == i_owner, "Sender is not owner");

        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // want to be able to set a minimum fund in USD
        // 1. how do we send ETH to this address?

        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "did not send enough funds"
        ); //1e18 == 1 * 10 ** 18 == 1000000000000000000 wei
        s_funders.push(msg.sender);
        s_AddressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyowner {
        for (
            uint256 funderindex = 0;
            funderindex < s_funders.length;
            funderindex = funderindex++
        ) {
            address funder = s_funders[funderindex];
            s_AddressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        //transfer automatically rever if the transaction fails
        //payable(msg.sender).transfer(address(this).balance);
        // send we have to revert it manually by using require statement
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess,"send failed");
        //call best
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "send failed");
    }

    function cheaperWithdraw() public onlyowner {
        address[] memory funders = s_funders;

        for (
            uint256 funderindex = 0;
            funderindex < funders.length;
            funderindex++
        ) {
            address funder = funders[funderindex];
            s_AddressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_AddressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

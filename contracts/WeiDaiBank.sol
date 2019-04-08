pragma solidity ^0.5.0;
import "../node_modules/openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./WeiDai.sol";
import "./PatienceRegulationEngine.sol";

contract WeiDaiBank is Secondary {

	address weiDaiAddress;
	address daiAddress;
	address donationAddress;
	address preAddress;
	address self;
	uint lastKnownExchangeRate;

	using SafeMath for uint;

	function setDependencies(address weiDai, address dai, address pre) public onlyPrimary{
		daiAddress = dai;
		weiDaiAddress = weiDai;
		preAddress = pre;
		self = address(this);
		lastKnownExchangeRate = 100; //1 weidai == 1 US cent.
	} 

	function setDonationAddress(address donation) public onlyPrimary {
		donationAddress = donation;
	}

	function daiPerMyriadWeidai()public view returns (uint) {
		uint totalWeiDai = WeiDai(weiDaiAddress).totalSupply();
		
		if(totalWeiDai == 0){
			return lastKnownExchangeRate;
		}
		return ERC20(daiAddress).balanceOf(self)
		.mul(10000) //scale by a myriad
		.div(WeiDai(weiDaiAddress).totalSupply());
	}

	function issue(address sender, uint weidai,uint dai) public { //sender is dai holder, msg.sender is calling contract
		require(msg.sender == preAddress, "only patience regulation engine can invoke this function");
		ERC20(daiAddress).transferFrom(sender, self, dai);  //test failing
		WeiDai(weiDaiAddress).issue(msg.sender, weidai);
	}

	function redeemWeiDai(uint weiDai) public {
		uint exchangeRate = daiPerMyriadWeidai();
		uint fee = WeiDai(weiDaiAddress).totalSupply() - weiDai == 0? 0 : weiDai*2/100;
		uint donation = (fee*PatienceRegulationEngine(preAddress).getDonationSplit(msg.sender))/100;

		WeiDai(weiDaiAddress).burn(msg.sender, weiDai-donation);
		WeiDai(weiDaiAddress).transferFrom(msg.sender, self,donation);

		uint weiDaiToRedeem = weiDai - fee;
		
		uint daiPayable = weiDaiToRedeem
		.mul(exchangeRate)
		.div(10000);
		ERC20(daiAddress).transfer(msg.sender, daiPayable);
		lastKnownExchangeRate = daiPerMyriadWeidai();
		emit DaiPerMyriadWeiDai (lastKnownExchangeRate, block.timestamp, block.number);
	}

	function withdrawDonations() public onlyPrimary {
		uint balance = ERC20(weiDaiAddress).balanceOf(self);
		ERC20(weiDaiAddress).transfer(donationAddress,balance);
	} 

	event DaiPerMyriadWeiDai (uint amount, uint timestamp, uint blocknumber);
}

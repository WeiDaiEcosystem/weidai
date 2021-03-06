pragma solidity >=0.5.0 <0.6.0;
import "../node_modules//openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockDai is Secondary, ERC20 {

	constructor() public{
		uint gwei = 13 * (1 ether/100);
		_mint(msg.sender,1e8 ether + gwei);
		_mint(address(0x17fd39A28418444C60889d25C3b96126570B0061),1e8 ether);
	}

	function name() public pure returns (string memory) {
		return "Mock DAI";
	}

	function symbol() public pure returns (string memory) {
		return "MDAI";
	}

	function decimals() public pure returns (uint8) {
		return 18;
	}
}



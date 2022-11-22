// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Verify {
 
   address importantAddress;
   constructor (address _importantAddress) public{
       importantAddress = _importantAddress;
   }
  
   function isValidData(uint256 _number, string memory _word, bytes memory sig) public view returns(bool){
       bytes32 message = keccak256(abi.encodePacked(_number, _word));
       return (recoverSigner(message, sig) == importantAddress);
   }
   function recoverSigner(bytes32 message, bytes memory sig)
       public
       pure
       returns (address)
     {
       uint8 v;
       bytes32 r;
       bytes32 s;
       (v, r, s) = splitSignature(sig);
       return ecrecover(message, v, r, s);
   }
   function splitSignature(bytes memory sig)
       public
       pure
       returns (uint8, bytes32, bytes32)
     {
       require(sig.length == 65);
       bytes32 r;
       bytes32 s;
       uint8 v;
       assembly {
           // first 32 bytes, after the length prefix
           r := mload(add(sig, 32))
           // second 32 bytes
           s := mload(add(sig, 64))
           // final byte (first byte of the next 32 bytes)
           v := byte(0, mload(add(sig, 96)))
       }
 
       return (v, r, s);
   }
}
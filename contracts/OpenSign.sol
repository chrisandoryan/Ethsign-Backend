// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract OpenSign{
    struct Document {
        uint timestamp;
        bytes ipfs_hash;
        address[] signatures;
    }

    // mappings   
    mapping(address => bytes[]) public users; // maps addresses to agreement id
    mapping(bytes32 => Document) public documents; // maps keccak256(agreement_id) hashes to documents

    function addDocument(bytes memory doc_id, bytes memory ipfs_hash) public {
        users[msg.sender].push(ipfs_hash); // Add document to users' "signed" list
        address[] memory sender = new address[](1);
        sender[0] = msg.sender;

        documents[keccak256(doc_id)] = Document(block.timestamp, ipfs_hash, sender);
    }

    function signDocument(bytes memory doc_id) public {
        users[msg.sender].push(doc_id);
        documents[keccak256(doc_id)].signatures.push(msg.sender);
    }
    
    function getSignatures(bytes memory doc_id) public view returns (address[] memory) {
        return documents[keccak256(doc_id)].signatures;
    }
}
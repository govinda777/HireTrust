// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgreementRegistry {
    struct Agreement {
        string agreementId;
        address subscriber;
        address provider;
        string termsHash;
        bool isActive;
        uint256 createdAt;
    }

    mapping(string => Agreement) public agreements;
    string[] public agreementIds;

    event AgreementRegistered(string agreementId, address subscriber, address provider);

    function registerAgreement(
        string memory _agreementId,
        address _provider,
        string memory _termsHash
    ) public {
        require(bytes(agreements[_agreementId].agreementId).length == 0, "Agreement already exists");

        agreements[_agreementId] = Agreement({
            agreementId: _agreementId,
            subscriber: msg.sender,
            provider: _provider,
            termsHash: _termsHash,
            isActive: true,
            createdAt: block.timestamp
        });

        agreementIds.push(_agreementId);

        emit AgreementRegistered(_agreementId, msg.sender, _provider);
    }

    function getAgreement(string memory _agreementId) public view returns (Agreement memory) {
        return agreements[_agreementId];
    }
}

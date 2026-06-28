// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EscrowEngine {
    enum EscrowStatus { PENDING, LOCKED, RELEASED, CANCELLED }

    struct Escrow {
        string agreementId;
        address payable subscriber;
        address payable provider;
        uint256 amount;
        EscrowStatus status;
        string proofHash;
    }

    mapping(string => Escrow) public escrows;

    event FundsLocked(string agreementId, address subscriber, uint256 amount);
    event FundsReleased(string agreementId, address provider, uint256 amount);

    function lockFunds(string memory _agreementId, address payable _provider) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(escrows[_agreementId].amount == 0, "Escrow already exists");

        escrows[_agreementId] = Escrow({
            agreementId: _agreementId,
            subscriber: payable(msg.sender),
            provider: _provider,
            amount: msg.value,
            status: EscrowStatus.LOCKED,
            proofHash: ""
        });

        emit FundsLocked(_agreementId, msg.sender, msg.value);
    }

    function releaseFunds(string memory _agreementId, string memory _proofHash) public {
        Escrow storage escrow = escrows[_agreementId];
        require(escrow.status == EscrowStatus.LOCKED, "Escrow not locked");
        require(bytes(_proofHash).length > 0, "Proof hash is required");

        escrow.status = EscrowStatus.RELEASED;
        escrow.proofHash = _proofHash;

        uint256 amount = escrow.amount;
        escrow.amount = 0;

        (bool success, ) = escrow.provider.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsReleased(_agreementId, escrow.provider, amount);
    }

    function getEscrow(string memory _agreementId) public view returns (Escrow memory) {
        return escrows[_agreementId];
    }
}

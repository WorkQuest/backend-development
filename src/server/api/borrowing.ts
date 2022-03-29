import { Op } from "sequelize";
import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import {
  Borrowing, BorrowingBorrowedEvent,
  BorrowingRefundedEvent,
  BorrowingStatus,
  User,
  Wallet
} from "@workquest/database-models/lib/models";

export async function createBorrowing(r) {
  const user: User = r.auth.credentials;

  const userWaller = Wallet.findOne({
    where: { userId: user.id },
  });

  if (!userWaller) {
    return error(Errors.Forbidden, 'User does not have a wallet on the platform', {});
  }

  const alreadyBorrowed = !!await Borrowing.findOne({
    where: {
      userId: r.auth.credentials.id,
      status: { [Op.ne]: BorrowingStatus.Closed }
    }
  });

  if (alreadyBorrowed) {
    return error(Errors.AlreadyExists, 'User already has borrowing', {});
  }

  const borrowing = await Borrowing.create({
    userId: user.id,
    term: r.payload.term,
    collateral: r.payload.collateral,
    creditAmount: r.payload.credit,
    remainingCredit: r.payload.credit,
    symbol: r.payload.symbol
  });

  return output(borrowing);
}

export async function getBorrowings(r) {
  const borrowing = await Borrowing.findOne({
    where: {
      userId: r.auth.credentials.id,
      status: { [Op.ne]: BorrowingStatus.Closed }
    },
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    include: [{
      model: BorrowingRefundedEvent,
      as: 'refundedEvents',
      attributes: ['amount', 'timestamp', 'borrower', 'transactionHash']
    }, {
      model: BorrowingBorrowedEvent,
      as: 'borrowedEvent',
      attributes: ['timestamp']
    }],
  });

  return output(borrowing);
}

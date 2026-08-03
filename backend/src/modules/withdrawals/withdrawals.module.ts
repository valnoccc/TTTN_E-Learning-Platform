import { Module } from '@nestjs/common';

import { WithdrawalsController } from './controllers/withdrawals.controller';
import { AdminWithdrawalsController } from './controllers/admin-withdrawals.controller';
import { InstructorWalletService } from './services/instructor-wallet.service';
import { WithdrawalsService } from './services/withdrawals.service';

@Module({
  controllers: [WithdrawalsController, AdminWithdrawalsController],
  providers: [InstructorWalletService, WithdrawalsService],
  exports: [InstructorWalletService, WithdrawalsService],
})
export class WithdrawalsModule {}

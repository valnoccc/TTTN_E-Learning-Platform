import { Controller, Patch, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Controller('users/me/policies')
@UseGuards(JwtAuthGuard)
export class UserPolicyController {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Patch()
  async updatePolicyAcceptance(
    @Request() req,
    @Body() body: { policyType: 'instructor' | 'forum' }
  ) {
    const userId = req.user.sub;
    const updateData: Partial<User> = {};
    
    if (body.policyType === 'instructor') {
      updateData.instructorPolicyAcceptedAt = new Date();
    } else if (body.policyType === 'forum') {
      updateData.forumPolicyAcceptedAt = new Date();
    } else {
      throw new BadRequestException('Invalid policyType');
    }

    await this.userRepository.update(userId, updateData);
    
    // Fetch updated user to return
    const updatedUser = await this.userRepository.findOne({ where: { maND: userId }});
    return { 
      message: 'Đã cập nhật trạng thái đồng ý chính sách',
      data: updatedUser 
    };
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../../auth/auth.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { HoSoGiangVien } from '../../instructors/entities/ho-so-giang-vien.entity';
import { InstructorProfileDetailsService } from '../../instructors/services/instructor-profile-details.service';
import { ApplyInstructorDto } from '../dto/apply-instructor.dto';

@Injectable()
export class InstructorApplicationsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(HoSoGiangVien)
    private readonly profileRepository: Repository<HoSoGiangVien>,
    private readonly authService: AuthService,
    private readonly profileDetailsService: InstructorProfileDetailsService,
  ) {}

  async apply(userId: number, dto: ApplyInstructorDto) {
    const user = await this.userRepository.findOne({ where: { maND: userId } });
    const { BangCaps, KinhNghiems, ...profileDto } = dto;
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng.');

    if (user.vaiTro === UserRole.ADMIN) {
      throw new ForbiddenException('Tài khoản quản trị không được phép đăng ký làm giảng viên.');
    }

    if (user.vaiTro === UserRole.INSTRUCTOR) {
      throw new ForbiddenException('Tài khoản này đã là giảng viên của nền tảng.');
    }

    const existingProfile = await this.profileRepository.findOne({
      where: { MaND: userId },
    });
    let profile: HoSoGiangVien;
    if (existingProfile) {
      Object.assign(existingProfile, profileDto);
      profile = await this.profileRepository.save(existingProfile);
    } else {
      profile = this.profileRepository.create({ MaND: userId, ...profileDto });
      profile = await this.profileRepository.save(profile);
    }

    if (BangCaps !== undefined || KinhNghiems !== undefined) {
      await this.profileDetailsService.replaceDetails(profile.MaHoSo, {
        qualifications: BangCaps,
        experiences: KinhNghiems,
      });
    }

    user.vaiTro = UserRole.INSTRUCTOR;
    await this.userRepository.save(user);

    return this.authService.createAuthResponseForUser(user);
  }
}

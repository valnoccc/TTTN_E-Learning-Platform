import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BangCapGiangVien } from '../entities/bang-cap-giang-vien.entity';
import { KinhNghiemGiangVien } from '../entities/kinh-nghiem-giang-vien.entity';

export type QualificationInput = Partial<Omit<BangCapGiangVien, 'MaBangCap' | 'MaHoSo'>>;
export type ExperienceInput = Partial<Omit<KinhNghiemGiangVien, 'MaKinhNghiem' | 'MaHoSo'>>;

@Injectable()
export class InstructorProfileDetailsService {
  constructor(
    @InjectRepository(BangCapGiangVien)
    private readonly qualificationRepository: Repository<BangCapGiangVien>,
    @InjectRepository(KinhNghiemGiangVien)
    private readonly experienceRepository: Repository<KinhNghiemGiangVien>,
  ) {}

  async replaceDetails(
    profileId: number,
    input: { qualifications?: QualificationInput[]; experiences?: ExperienceInput[] },
  ) {
    let qualifications: BangCapGiangVien[] | undefined;
    let experiences: KinhNghiemGiangVien[] | undefined;

    if (input.qualifications !== undefined) {
      await this.qualificationRepository.delete({ MaHoSo: profileId });
      qualifications = await this.qualificationRepository.save(
        input.qualifications.map((item, index) =>
          this.qualificationRepository.create({ MaHoSo: profileId, ThuTu: index, ...item }),
        ),
      );
    }

    if (input.experiences !== undefined) {
      await this.experienceRepository.delete({ MaHoSo: profileId });
      experiences = await this.experienceRepository.save(
        input.experiences.map((item, index) =>
          this.experienceRepository.create({ MaHoSo: profileId, ThuTu: index, ...item }),
        ),
      );
    }

    return { qualifications, experiences };
  }

  async getDetails(profileId: number) {
    const [qualifications, experiences] = await Promise.all([
      this.qualificationRepository.find({ where: { MaHoSo: profileId }, order: { ThuTu: 'ASC' } }),
      this.experienceRepository.find({ where: { MaHoSo: profileId }, order: { ThuTu: 'ASC' } }),
    ]);

    return { qualifications, experiences };
  }
}

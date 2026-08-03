import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BangCapGiangVien } from '../entities/bang-cap-giang-vien.entity';
import { KinhNghiemGiangVien } from '../entities/kinh-nghiem-giang-vien.entity';

export type QualificationInput = Partial<Omit<BangCapGiangVien, 'MaBangCap' | 'MaHoSo'>>;
export type ExperienceInput = Partial<Omit<KinhNghiemGiangVien, 'MaKinhNghiem' | 'MaHoSo'>>;

function normalizeList<T>(value: T[] | string, fieldName: string): T[] {
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through to a consistent API error below.
  }

  throw new BadRequestException(`${fieldName} phải là một danh sách hợp lệ.`);
}

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
    input: { qualifications?: QualificationInput[] | string; experiences?: ExperienceInput[] | string },
  ) {
    let qualifications: BangCapGiangVien[] | undefined;
    let experiences: KinhNghiemGiangVien[] | undefined;

    if (input.qualifications !== undefined) {
      const qualificationsInput = normalizeList(input.qualifications, 'BangCaps');
      await this.qualificationRepository.delete({ MaHoSo: profileId });
      qualifications = await this.qualificationRepository.save(
        qualificationsInput.map((item, index) =>
          this.qualificationRepository.create({ MaHoSo: profileId, ThuTu: index, ...item }),
        ),
      );
    }

    if (input.experiences !== undefined) {
      const experiencesInput = normalizeList(input.experiences, 'KinhNghiems');
      await this.experienceRepository.delete({ MaHoSo: profileId });
      experiences = await this.experienceRepository.save(
        experiencesInput.map((item, index) =>
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

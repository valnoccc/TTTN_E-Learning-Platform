import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CauHoiDienDan } from './entities/cau-hoi-dien-dan.entity';
import { TheTuDienDan } from './entities/the-tu-dien-dan.entity';
import { CauTraLoiDienDan } from './entities/cau-tra-loi-dien-dan.entity';
import { User } from '../users/entities/user.entity';
import {
  FilterQuestionDto,
  SapXepCauHoi,
  CreateQuestionDto,
  CreateAnswerDto,
} from './dto/forum.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(CauHoiDienDan)
    private readonly cauHoiRepository: Repository<CauHoiDienDan>,
    @InjectRepository(TheTuDienDan)
    private readonly theTuRepository: Repository<TheTuDienDan>,
    @InjectRepository(CauTraLoiDienDan)
    private readonly cauTraLoiRepository: Repository<CauTraLoiDienDan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async layDanhSachCauHoi(filter: FilterQuestionDto) {
    const { tuKhoa, sapXep, trang = 1, soLuong = 15 } = filter;

    const queryBuilder = this.cauHoiRepository
      .createQueryBuilder('cauHoi')
      .leftJoinAndSelect('cauHoi.tacGia', 'tacGia')
      .leftJoinAndSelect('cauHoi.danhSachThe', 'theTu');

    if (tuKhoa) {
      queryBuilder.andWhere(
        '(cauHoi.tieuDe LIKE :tuKhoa OR cauHoi.noiDung LIKE :tuKhoa)',
        { tuKhoa: `%${tuKhoa}%` },
      );
    }

    switch (sapXep) {
      case SapXepCauHoi.NHIEU_VIEW_NHAT:
        queryBuilder.orderBy('cauHoi.luotXem', 'DESC');
        break;
      case SapXepCauHoi.CHUA_TRA_LOI:
        queryBuilder.andWhere('cauHoi.soCauTraLoi = 0');
        queryBuilder.orderBy('cauHoi.ngayTao', 'DESC');
        break;
      case SapXepCauHoi.MOI_NHAT:
      default:
        queryBuilder.orderBy('cauHoi.ngayTao', 'DESC');
        break;
    }

    const skip = (trang - 1) * soLuong;
    queryBuilder.skip(skip).take(soLuong);

    const [items, tongSo] = await queryBuilder.getManyAndCount();

    const danhSach = items.map((item) => ({
      maCH: item.maCH,
      tieuDe: item.tieuDe,
      noiDung: item.noiDung,
      luotXem: item.luotXem,
      luotBinhChon: item.luotBinhChon,
      soCauTraLoi: item.soCauTraLoi,
      ngayTao: item.ngayTao,
      tacGia: {
        maND: item.tacGia?.maND,
        hoTen: item.tacGia?.hoTen,
        anhDaiDien: item.tacGia?.anhDaiDien,
      },
      danhSachThe:
        item.danhSachThe?.map((the) => ({
          maThe: the.maThe,
          tenThe: the.tenThe,
          duongDan: the.duongDan,
        })) || [],
    }));

    return {
      danhSach,
      tongSo,
      tongSoTrang: Math.ceil(tongSo / soLuong),
    };
  }

  async layChiTietCauHoi(id: number, incrementView: boolean = true) {
    const cauHoi = await this.cauHoiRepository
      .createQueryBuilder('cauHoi')
      .leftJoinAndSelect('cauHoi.tacGia', 'tacGia')
      .leftJoinAndSelect('cauHoi.danhSachThe', 'theTu')
      .leftJoinAndSelect('cauHoi.danhSachTraLoi', 'traLoi')
      .leftJoinAndSelect('traLoi.tacGia', 'nguoiTraLoi')
      .leftJoinAndSelect('traLoi.cacPhanHoi', 'phanHoi')
      .leftJoinAndSelect('phanHoi.tacGia', 'nguoiPhanHoi')
      .where('cauHoi.maCH = :id', { id })
      .orderBy('traLoi.ngayTao', 'ASC')
      .getOne();

    if (!cauHoi) {
      throw new Error('Câu hỏi không tồn tại');
    }

    if (incrementView) {
      // Tăng lượt xem
      await this.cauHoiRepository.increment({ maCH: id }, 'luotXem', 1);
      cauHoi.luotXem += 1;
    }

    return {
      maCH: cauHoi.maCH,
      tieuDe: cauHoi.tieuDe,
      noiDung: cauHoi.noiDung,
      luotXem: cauHoi.luotXem,
      luotBinhChon: cauHoi.luotBinhChon,
      soCauTraLoi: cauHoi.soCauTraLoi,
      ngayTao: cauHoi.ngayTao,
      tacGia: {
        maND: cauHoi.tacGia?.maND,
        hoTen: cauHoi.tacGia?.hoTen,
        anhDaiDien: cauHoi.tacGia?.anhDaiDien,
      },
      danhSachThe:
        cauHoi.danhSachThe?.map((the) => ({
          maThe: the.maThe,
          tenThe: the.tenThe,
          duongDan: the.duongDan,
        })) || [],
      danhSachTraLoi:
        cauHoi.danhSachTraLoi
          ?.filter((tl) => !tl.maCTL_Cha)
          .map((tl) => ({
            maCTL: tl.maCTL,
            noiDung: tl.noiDung,
            luotBinhChon: tl.luotBinhChon,
            laDapAnDung: tl.laDapAnDung,
            ngayTao: tl.ngayTao,
            tacGia: {
              maND: tl.tacGia?.maND,
              hoTen: tl.tacGia?.hoTen,
              anhDaiDien: tl.tacGia?.anhDaiDien,
            },
            cacPhanHoi:
              tl.cacPhanHoi
                ?.map((ph) => ({
                  maCTL: ph.maCTL,
                  noiDung: ph.noiDung,
                  luotBinhChon: ph.luotBinhChon,
                  ngayTao: ph.ngayTao,
                  tacGia: {
                    maND: ph.tacGia?.maND,
                    hoTen: ph.tacGia?.hoTen,
                    anhDaiDien: ph.tacGia?.anhDaiDien,
                  },
                }))
                .sort(
                  (a, b) =>
                    new Date(a.ngayTao).getTime() -
                    new Date(b.ngayTao).getTime(),
                ) || [],
          })) || [],
    };
  }

  async taoCauHoi(maND: number, createDto: CreateQuestionDto) {
    // Xử lý the tu (tags)
    const theTus: TheTuDienDan[] = [];
    if (createDto.tags && createDto.tags.length > 0) {
      for (const tagName of createDto.tags) {
        const duongDan = tagName.toLowerCase().replace(/\s+/g, '-');
        let tag = await this.theTuRepository.findOne({ where: { duongDan } });
        if (!tag) {
          tag = this.theTuRepository.create({ tenThe: tagName, duongDan });
          tag = await this.theTuRepository.save(tag);
        }
        theTus.push(tag);
      }
    }

    const cauHoi = this.cauHoiRepository.create({
      tieuDe: createDto.tieuDe,
      noiDung: createDto.noiDung,
      maND,
      luotXem: 0,
      danhSachThe: theTus,
    });

    return this.cauHoiRepository.save(cauHoi);
  }

  async taoTraLoi(maCH: number, maND: number, createDto: CreateAnswerDto) {
    const cauHoi = await this.cauHoiRepository.findOne({ where: { maCH } });
    if (!cauHoi) {
      throw new Error('Câu hỏi không tồn tại');
    }

    const traLoi = this.cauTraLoiRepository.create({
      noiDung: createDto.noiDung,
      maND,
      maCH,
      maCTL_Cha: createDto.maCTL_Cha || null,
    });

    const savedTraLoi = await this.cauTraLoiRepository.save(traLoi);
    await this.cauHoiRepository.increment({ maCH }, 'soCauTraLoi', 1);

    // Gửi thông báo
    try {
      let recipientId: number | null = null;
      let title = '';
      let message = '';
      const nguoiTraLoi = await this.userRepository.findOne({
        where: { maND },
      });
      const ten = nguoiTraLoi ? nguoiTraLoi.hoTen : 'Một người dùng';

      if (createDto.maCTL_Cha) {
        const cauTraLoiCha = await this.cauTraLoiRepository.findOne({
          where: { maCTL: createDto.maCTL_Cha },
        });
        if (cauTraLoiCha && cauTraLoiCha.maND !== maND) {
          recipientId = cauTraLoiCha.maND;
          title = 'Phản hồi mới';
          message = `${ten} đã phản hồi bình luận của bạn.`;
        }
      } else if (cauHoi.maND !== maND) {
        recipientId = cauHoi.maND;
        title = 'Bình luận mới';
        message = `${ten} đã bình luận vào câu hỏi của bạn.`;
      }

      if (recipientId) {
        await this.notificationsService.createNotification({
          maND: recipientId,
          maNguoiGui: maND,
          loaiThongBao: NotificationType.FORUM,
          tieuDe: title,
          noiDung: `${message}|||/forum/question/${maCH}`,
        });
      }
    } catch (e) {
      console.log('Notification error:', e);
    }

    return savedTraLoi;
  }

  async upvoteQuestion(maCH: number, maND: number) {
    const cauHoi = await this.cauHoiRepository.findOne({ where: { maCH } });
    if (!cauHoi) throw new Error('Câu hỏi không tồn tại');

    let nguoiThich = cauHoi.nguoiThich || [];
    const userIdStr = maND.toString();
    let isLiked = false;

    if (nguoiThich.includes(userIdStr as any)) {
      nguoiThich = nguoiThich.filter((id) => id.toString() !== userIdStr);
      cauHoi.luotBinhChon = Math.max(0, cauHoi.luotBinhChon - 1);
    } else {
      nguoiThich.push(userIdStr as any);
      cauHoi.luotBinhChon += 1;
      isLiked = true;
    }

    cauHoi.nguoiThich = nguoiThich;
    await this.cauHoiRepository.save(cauHoi);

    if (isLiked && cauHoi.maND !== maND) {
      try {
        const nguoiLike = await this.userRepository.findOne({
          where: { maND },
        });
        const ten = nguoiLike ? nguoiLike.hoTen : 'Một người dùng';
        await this.notificationsService.createNotification({
          maND: cauHoi.maND,
          maNguoiGui: maND,
          loaiThongBao: NotificationType.FORUM,
          tieuDe: 'Lượt thích mới',
          noiDung: `${ten} đã thích câu hỏi của bạn.|||/forum/question/${maCH}`,
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }

    return { success: true, isLiked, luotBinhChon: cauHoi.luotBinhChon };
  }

  async upvoteAnswer(maCTL: number, maND: number) {
    const cauTraLoi = await this.cauTraLoiRepository.findOne({
      where: { maCTL },
    });
    if (!cauTraLoi) throw new Error('Câu trả lời không tồn tại');

    let nguoiThich = cauTraLoi.nguoiThich || [];
    const userIdStr = maND.toString();
    let isLiked = false;

    if (nguoiThich.includes(userIdStr as any)) {
      nguoiThich = nguoiThich.filter((id) => id.toString() !== userIdStr);
      cauTraLoi.luotBinhChon = Math.max(0, cauTraLoi.luotBinhChon - 1);
    } else {
      nguoiThich.push(userIdStr as any);
      cauTraLoi.luotBinhChon += 1;
      isLiked = true;
    }

    cauTraLoi.nguoiThich = nguoiThich;
    await this.cauTraLoiRepository.save(cauTraLoi);

    if (isLiked && cauTraLoi.maND !== maND) {
      try {
        const nguoiLike = await this.userRepository.findOne({
          where: { maND },
        });
        const ten = nguoiLike ? nguoiLike.hoTen : 'Một người dùng';
        await this.notificationsService.createNotification({
          maND: cauTraLoi.maND,
          maNguoiGui: maND,
          loaiThongBao: NotificationType.FORUM,
          tieuDe: 'Lượt thích mới',
          noiDung: `${ten} đã thích bình luận của bạn.|||/forum/question/${cauTraLoi.maCH}`,
        });
      } catch (e) {
        console.log('Notification error:', e);
      }
    }

    return { success: true, isLiked, luotBinhChon: cauTraLoi.luotBinhChon };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { LessonsService } from './services/lessons.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('LessonsController', () => {
  let controller: LessonsController;
  let lessonsService: {
    create: jest.Mock;
    update: jest.Mock;
  };
  let cloudinaryService: {
    uploadFile: jest.Mock;
  };

  beforeEach(async () => {
    lessonsService = {
      create: jest.fn(),
      update: jest.fn(),
    };
    cloudinaryService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonsController],
      providers: [
        { provide: LessonsService, useValue: lessonsService },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('parses the preview flag when creating a lesson', async () => {
    lessonsService.create.mockResolvedValue({
      maBH: 1,
      choPhepXemTruoc: true,
    });

    await controller.create(
      {},
      {
        maKH: '10',
        tieu_de: 'Bài học thử',
        noi_dung: 'Nội dung',
        thu_tu: '2',
        choPhepXemTruoc: 'true',
      },
      undefined,
    );

    expect(lessonsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        maKH: 10,
        thuTu: 2,
        choPhepXemTruoc: true,
      }),
    );
  });

  it('parses the preview flag when updating a lesson', async () => {
    lessonsService.update.mockResolvedValue({
      maBH: 1,
      choPhepXemTruoc: false,
    });

    await controller.update(
      1,
      {
        tieu_de: 'Bài học cập nhật',
        noi_dung: 'Nội dung mới',
        thu_tu: '3',
        cho_phep_xem_truoc: 'false',
      },
      undefined,
    );

    expect(lessonsService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        thuTu: 3,
        choPhepXemTruoc: false,
      }),
    );
  });
});

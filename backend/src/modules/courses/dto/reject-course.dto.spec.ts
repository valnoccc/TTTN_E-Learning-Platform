import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RejectCourseDto } from './reject-course.dto';

describe('RejectCourseDto', () => {
  it('accepts lyDo with the global whitelist validation policy', async () => {
    const dto = plainToInstance(RejectCourseDto, {
      lyDo: 'Video có nội dung không phù hợp.',
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });
});

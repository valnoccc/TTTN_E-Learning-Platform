import { getMetadataArgsStorage } from 'typeorm';
import { KhoaHoc } from './course.entity';

describe('KhoaHoc entity schema mapping', () => {
  it('does not map removed legacy objective and requirement columns', () => {
    const mappedColumnNames = getMetadataArgsStorage()
      .columns.filter((column) => column.target === KhoaHoc)
      .map((column) => column.options.name ?? String(column.propertyName));

    expect(mappedColumnNames).not.toContain('KetQuaHocTap');
    expect(mappedColumnNames).not.toContain('YeuCauKhoaHoc');
  });
});

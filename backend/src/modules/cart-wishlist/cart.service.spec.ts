import { CartService } from './cart.service';

describe('CartService purchase eligibility', () => {
  it('rejects an admin before adding a course to the cart', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ VaiTro: 'ADMIN' }]) };
    const service = new CartService(dataSource as never);

    await expect(service.addToCart(1, 10)).rejects.toThrow(
      'Tài khoản quản trị không được phép mua khóa học',
    );
    expect(dataSource.query).toHaveBeenCalledTimes(1);
  });

  it('rejects an admin before syncing client cart items', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ VaiTro: 'ADMIN' }]) };
    const service = new CartService(dataSource as never);

    await expect(service.syncCartFromClient(1, [10])).rejects.toThrow(
      'Tài khoản quản trị không được phép mua khóa học',
    );
    expect(dataSource.query).toHaveBeenCalledTimes(1);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue({
      items: [{ id: '1', username: 'player1' }],
      total: 1,
      page: 1,
      limit: 20,
    }),
    findById: jest.fn().mockResolvedValue({
      id: '1',
      username: 'player1',
      role: 'CLIENT',
    }),
    updateProfile: jest.fn().mockResolvedValue({
      id: '1',
      firstName: 'Олександр',
    }),
    sanitize: jest.fn().mockImplementation((u) => u),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUsers() should return list of users', async () => {
    const res = await controller.getUsers();
    expect(service.findAll).toHaveBeenCalled();
    expect(res.total).toBe(1);
  });

  it('getUserById() should return sanitized user', async () => {
    const res = await controller.getUserById('1');
    expect(service.findById).toHaveBeenCalledWith('1');
    expect(res.username).toBe('player1');
  });

  it('updateProfile() should update and return profile', async () => {
    const res = await controller.updateProfile('1', { firstName: 'Олександр' });
    expect(service.updateProfile).toHaveBeenCalledWith('1', { firstName: 'Олександр' });
    expect(res.message).toBe('Профіль успішно оновлено');
  });

  it('updateStatus() should update status', () => {
    const res = controller.updateStatus('1', { status: 'BLOCKED', reason: 'Toxicity' });
    expect(res.status).toBe('BLOCKED');
  });
});

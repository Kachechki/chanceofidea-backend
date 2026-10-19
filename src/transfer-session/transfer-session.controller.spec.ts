import { Test, TestingModule } from '@nestjs/testing';
import { TransferSessionController } from './transfer-session.controller';

describe('TransferSessionController', () => {
  let controller: TransferSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferSessionController],
    }).compile();

    controller = module.get<TransferSessionController>(TransferSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

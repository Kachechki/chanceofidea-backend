import { Test, TestingModule } from '@nestjs/testing';
import { AppealController } from './appeal.controller';

describe('AppealController', () => {
  let controller: AppealController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppealController],
    }).compile();

    controller = module.get<AppealController>(AppealController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

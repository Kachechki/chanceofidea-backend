import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

import { SettingsService } from "./Settings.service";
import { SettingsEntity } from "../entities/Settings.entity";
import { PrefferedLocaleEnum } from "../../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../../enums/Theme.enum";

describe("SettingsService", () => {
  let service: SettingsService;

  let repository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(SettingsEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("update", () => {
    const updateData = {
      userId: "user-uuid",
      prefferedLocale: PrefferedLocaleEnum.EN,
      theme: ThemeEnum.DARK,
    };

    it("should update existing settings", async () => {
      repository.findOneBy.mockResolvedValue({
        id: "settings-uuid",
      });

      repository.save.mockResolvedValue(undefined);

      await service.update(updateData);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        user: { id: updateData.userId },
      });

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith({
        id: "settings-uuid",
        prefferedLocale: updateData.prefferedLocale,
        theme: updateData.theme,
      });
    });

    it("should throw NotFoundException if settings don't exist", async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update(updateData)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe("createDefault", () => {
    it("should create default settings and return their ID", async () => {
      repository.save.mockResolvedValue({
        id: "settings-uuid",
      });

      const result = await service.createDefault();

      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith({
        prefferedLocale: PrefferedLocaleEnum.EN,
        theme: ThemeEnum.LIGHT,
      });

      expect(result).toBe("settings-uuid");
    });
  });
});

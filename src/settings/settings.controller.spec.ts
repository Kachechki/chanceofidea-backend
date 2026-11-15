import { Test, TestingModule } from "@nestjs/testing";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./services/Settings.service";
import { UdpateSettingsDto } from "../dto/UpdateSettings.dto";
import { IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { PrefferedLocaleEnum } from "../enums/PrefferedLocale.enum";
import { ThemeEnum } from "../enums/Theme.enum";
import { AuthGuard } from "../auth/guards/Auth.guard";

describe("SettingsController", () => {
  let controller: SettingsController;

  let settingsService: {
    update: jest.Mock;
  };

  beforeEach(async () => {
    settingsService = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: settingsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("update", () => {
    it("should update the authenticated user's settings", async () => {
      const dto: UdpateSettingsDto = {
        prefferedLocale: Object.values(
          PrefferedLocaleEnum,
        )[0] as PrefferedLocaleEnum,
        theme: Object.values(ThemeEnum)[0] as ThemeEnum,
      };

      const req = {
        user: {
          id: "user-uuid",
        },
      } as IRequestWithRefresh;

      await controller.update(dto, req);

      expect(settingsService.update).toHaveBeenCalledTimes(1);

      expect(settingsService.update).toHaveBeenCalledWith({
        userId: "user-uuid",
        prefferedLocale: dto.prefferedLocale,
        theme: dto.theme,
      });
    });

    it("should propagate errors from SettingsService", async () => {
      const error = new Error("Settings update failed");

      settingsService.update.mockRejectedValueOnce(error);

      const dto: UdpateSettingsDto = {
        prefferedLocale: Object.values(
          PrefferedLocaleEnum,
        )[0] as PrefferedLocaleEnum,
        theme: Object.values(ThemeEnum)[0] as ThemeEnum,
      };

      const req = {
        user: {
          id: "user-uuid",
        },
      } as IRequestWithRefresh;

      await expect(controller.update(dto, req)).rejects.toThrow(error);
    });
  });
});

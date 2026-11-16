import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { NotifiactionService } from "./services/Notification.service";
import { AuthGuard } from "../auth/guards/Auth.guard";
import { type IRequestWithRefresh } from "../types/RequestWithRefresh.interface";
import { NotificationDto } from "../dto/Notification.dto";
import { NotificationEntity } from "./entites/Notification.entity";
import { ReadNotificationDto } from "../dto/ReadNotification.dto";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notification")
export class NotificationController {
  constructor(private readonly notificationService: NotifiactionService) {}

  @UseGuards(AuthGuard)
  @Get("all")
  @ApiOperation({
    summary: "Fetch all notifications",
    description:
      "Retrieves all notifications belonging to the authenticated user.",
  })
  @ApiOkResponse({
    description: "Notifications retrieved successfully",
    type: NotificationDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async fetchAll(@Req() req: IRequestWithRefresh): Promise<NotificationDto[]> {
    const entities = await this.notificationService.fetchAll(req.user.id);

    return entities.map((entity: NotificationEntity) => ({
      id: entity.id,
      body: entity.body,
      topic: entity.topic,
    }));
  }

  @UseGuards(AuthGuard)
  @Delete("read")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Mark a notification as read",
    description: "Deletes a notification belonging to the authenticated user.",
  })
  @ApiQuery({
    name: "id",
    type: String,
    format: "uuid",
    description: "ID of the notification to mark as read",
    example: "5b0d1714-ccbb-11f1-8ef8-12fb85b8a57f",
  })
  @ApiNoContentResponse({
    description: "Notification successfully marked as read",
  })
  @ApiNotFoundResponse({
    description: "Notification not found",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async read(
    @Query() dto: ReadNotificationDto,
    @Req() req: IRequestWithRefresh,
  ): Promise<void> {
    await this.notificationService.delete(dto.id, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Delete("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Mark all notifications as read",
    description:
      "Deletes all notifications belonging to the authenticated user.",
  })
  @ApiNoContentResponse({
    description: "All notifications successfully marked as read",
  })
  @ApiUnauthorizedResponse({
    description: "Authentication is required",
  })
  async readAll(@Req() req: IRequestWithRefresh): Promise<void> {
    await this.notificationService.deleteAll(req.user.id);
  }
}

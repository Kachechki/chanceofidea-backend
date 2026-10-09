"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const typeorm_1 = require("typeorm");
const Project_entity_1 = require("../../project/entities/Project.entity");
let UserEntity = class UserEntity {
    id;
    githubId;
    login;
    avatarUrl;
    bio;
    createdAt;
    projects;
};
exports.UserEntity = UserEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, update: false }),
    __metadata("design:type", Number)
], UserEntity.prototype, "githubId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, update: false }),
    __metadata("design:type", String)
], UserEntity.prototype, "login", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserEntity.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], UserEntity.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", update: false }),
    __metadata("design:type", Date)
], UserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)(),
    (0, typeorm_1.ManyToOne)(() => Project_entity_1.ProjectEntity, (project) => project.owner),
    __metadata("design:type", Project_entity_1.ProjectEntity)
], UserEntity.prototype, "projects", void 0);
exports.UserEntity = UserEntity = __decorate([
    (0, typeorm_1.Entity)()
], UserEntity);
//# sourceMappingURL=User.entity.js.map
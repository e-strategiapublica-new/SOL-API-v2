import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from "src/shared/dtos/response.dto";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { AgreementRegisterRequestDto } from "../dtos/agreement-register-request.dto";

import { AgreementService } from "../services/agreement.service";
import { FuncoesGuard } from "src/shared/guards/funcoes.guard";
import { UserTypeEnum } from "../enums/user-type.enum";
import { Funcoes } from "src/shared/decorators/function.decorator";
import { WorkPlanWorkPlanRequestDto } from "../dtos/work-plan-add-work-plan-request.dto";
import { JwtPayload } from "src/shared/interfaces/jwt-payload.interface";
import { UserRolesEnum } from "../enums/user-roles.enum";
import { UserTypeRequestDto } from "../dtos/user-type-request.dto";

@ApiTags("conveios")
@Controller("convenios")
export class AgreementController {
  private readonly _logger = new Logger(AgreementController.name);

  constructor(private _airdropService: AgreementService) { }


  @Get()
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  async get() {
    try {
     
      const response = await this._airdropService.findAll();

      return new ResponseDto(true, response, null);
    } catch (error) {
      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('without-project')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  async findAgreementsWithOutProject() {
    try {
      const response = await this._airdropService.findAgreementsWithOutProject();

      return new ResponseDto(true, response, null);
    } catch (error) {
      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('for-association')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  async getForAssociation(
    @Req() request,
  ) {
    try {

     
      const payload: JwtPayload = request.user;
      const response = await this._airdropService.findForAssociation(payload.userId);

      return new ResponseDto(true, response, null);
    } catch (error) {
      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Get('agreement-with-project')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  async getAgreementsWithProjects(
  ) {
    try {
      const response = await this._airdropService.getAgreementsWithProjects();

      return new ResponseDto(true, response, null);
    } catch (error) {
      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("register")
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async register(@Req() request, @Body() dto: AgreementRegisterRequestDto) {
    try {
   
      const payload: JwtPayload = request.user;
      dto.manager = payload.userId
      const response = await this._airdropService.register(dto);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Get("/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async findById(@Param("id") id: string) {
    try {
      
      const response = await this._airdropService.findById(id);
      return new ResponseDto(true, response, null)
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("by-user-id/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async findAgreementByUserId(@Param("id") id: string,
 @Body() userRoles: UserTypeRequestDto) {
    try {
      const response = await this._airdropService.findAgreementByUserId(id, userRoles.roles);
      return new ResponseDto(true, response, null)
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Delete("/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async deleteById(@Param("id") id: string) {
    try {
      const response = await this._airdropService.deleteById(id);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Put("update/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async update(@Param("id") id: string, @Body() dto: AgreementRegisterRequestDto) {
    try {
      const response = await this._airdropService.update(id, dto);

      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Put("add-work-plan/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async addWorkPlan(@Param("id") id: string, @Body() dto: WorkPlanWorkPlanRequestDto) {
    try {
      const response = await this._airdropService.addWorkPlan(id, dto.workPlanId);
      return new ResponseDto(true, response, null);
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

  @Put("remove-work-plan/:id")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, FuncoesGuard)
  @Funcoes(UserTypeEnum.administrador, UserTypeEnum.associacao, UserTypeEnum.project_manager)
  @ApiBearerAuth()
  async removeWorkPlan(@Param("id") id: string, @Body() dto: WorkPlanWorkPlanRequestDto) {
    try {
      const response = await this._airdropService.removeWorkPlan(id, dto.workPlanId);
      return response;
    } catch (error) {
      this._logger.error(error.message);

      throw new HttpException(new ResponseDto(false, null, [error.message]), HttpStatus.BAD_REQUEST);
    }
  }

}

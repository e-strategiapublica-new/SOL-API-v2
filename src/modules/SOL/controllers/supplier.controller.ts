import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { ResponseDto } from "src/shared/dtos/response.dto";
import { SupplierService } from "../services/supplier.service";
import { SupplierRegisterDto } from "../dtos/supplier-register-request.dto";
import { SupplierUpdateStatusDto } from "../dtos/supplier-update-status-request.dto";
import { SupplierGroupIdUpdateDto } from "../dtos/supplier-group-id-update.dto";
import { FuncoesGuard } from "src/shared/guards/funcoes.guard";
import { Funcoes } from "src/shared/decorators/function.decorator";
import { UserTypeEnum } from "../enums/user-type.enum";
import { SupplierRegisterBlockRequestDto } from "../dtos/supplier-register-block-request.dt";
import { UserService } from "../services/user.service";
import { UserRegisterRequestDto } from "../dtos/user-register-request.dto";
import { UserRolesEnum } from "../enums/user-roles.enum";
import { UserStatusEnum } from "../enums/user-status.enum";

@ApiTags('supplier')
@Controller('supplier')
export class SupplierController {

    private readonly logger = new Logger(SupplierController.name);

    constructor(
        private readonly supplierService: SupplierService,
        private readonly userService: UserService,
    ) { }

    @Post('register')
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async register(

        @Body() dto: SupplierRegisterDto,
    ) {

        try {


            const response = await this.supplierService.register(dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('registerWithoutAuth')
    @HttpCode(201)
    async registerWithoutAuth(
        @Body() dto: SupplierRegisterDto,
    ) {
        try {
            let response = await this.supplierService.register(dto);

            if (dto.legal_representative.email && dto.legal_representative.phone) {

                try {
                    const dto_user: UserRegisterRequestDto = {
                        name: dto.legal_representative.name,
                        phone: dto.legal_representative.phone,
                        email: dto.legal_representative.email,
                        document: dto.legal_representative.cpf,
                        type: UserTypeEnum.fornecedor,
                        roles: UserRolesEnum.geral,
                        status: UserStatusEnum.active,
                        association: "",
                        office: "",
                        supplier: response._id
                    }
                    response['supplier_user'] = await this.userService.register(dto_user);
                } catch (error) {
                    this.logger.error(error.message);

                    throw new HttpException(
                        new ResponseDto(false, null, [error.message]),
                        HttpStatus.BAD_REQUEST,
                    );
                }
            }

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('list')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async list() {

        try {

            const response = await this.supplierService.list();

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('listWithoutAuth')
    @HttpCode(200)
    async listWithoutAuth() {

        try {

            const response = await this.supplierService.list();

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Get('get-by-id/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getById(
        @Param('_id') _id: string,
    ) {

        try {

            const response = await this.supplierService.listById(_id);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }




    @Put('update/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async updateById(
        @Param('_id') _id: string,
        @Body() dto: SupplierRegisterDto,
    ) {

        try {

            const response = await this.supplierService.update(_id, dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('update-status/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async updateStatusById(
        @Param('_id') _id: string,
        @Body() dto: SupplierUpdateStatusDto,
    ) {

        try {

            const response = await this.supplierService.updateStatus(_id, dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('update-group/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async updateGroupById(
        @Param('_id') _id: string,
        @Body() dto: SupplierGroupIdUpdateDto,
    ) {

        try {

            const response = await this.supplierService.updateGroup(_id, dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('block/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, FuncoesGuard)
    @Funcoes(UserTypeEnum.administrador)
    @ApiBearerAuth()
    async block(
        @Param('_id') _id: string,
        @Body() dto: SupplierRegisterBlockRequestDto
    ) {

        try {

            const response = await this.supplierService.block(_id, dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Put('unblock/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard, FuncoesGuard)
    @Funcoes(UserTypeEnum.administrador)
    @ApiBearerAuth()
    async unblock(
        @Param('_id') _id: string,
        @Body() dto: SupplierRegisterBlockRequestDto
    ) {

        try {

            const response = await this.supplierService.unblock(_id, dto);

            return new ResponseDto(
                true,
                response,
                null,
            );


        } catch (error) {
            this.logger.error(error.message);

            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Delete('delete-by-id/:_id')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteById(
        @Param('_id') _id: string,
    ) {

        try {

            const result = await this.supplierService.deleteById(_id);

            return new ResponseDto(
                true,
                result,
                null,
            );

        } catch (error) {
            throw new HttpException(
                new ResponseDto(false, null, [error.message]),
                HttpStatus.BAD_REQUEST,
            );
        }
    }


}

import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Put, Req, UseGuards, NotFoundException  } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { ClassesService } from "../services/classes.service";
import { ClassesModel } from "../models/database/classes.model";
import { ErrorManager } from "../../../shared/utils/error.manager";

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
      
    constructor(
        private readonly classesService: ClassesService,
        private readonly classesModel: ClassesModel
    ) { }
    

    @Get('list')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async list() {

        try {    
                        
            const res = await this.classesModel.list();

            return res;            

        } catch (error) {            
            throw ErrorManager.createError(error)
        }
    }

    @Post("register")
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)    
    @ApiBearerAuth()
    async register(@Body() dto) {
        try {
            
            await this.classesModel.verifyCodeExists(dto.code);                                                           
            await this.classesModel.saveClass(dto);
            
            return {type: "success"}

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    }   

    @Put("update/:id")
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)    
    @ApiBearerAuth()
    async update(@Param("id") id: string, @Body() dto: any) {
        try {            

            await this.classesModel.updateClass(id, dto);

            return { type: "success" }

        } catch (error) {
            throw ErrorManager.createError(error)
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

            await this.classesModel.deleteById(_id);                                        
           
            return { type: "success" }           

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    }

}

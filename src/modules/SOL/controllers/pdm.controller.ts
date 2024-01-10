import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Logger, Param, Post, Put, Req, UseGuards, NotFoundException  } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guards/jwt-auth.guard";
import { PdmService } from "../services/pdm.service";
import { PdmModel } from "../models/database/pdm.model";
import { ItemsModel } from "../models/database/items.model";
import { ErrorManager } from "../../../shared/utils/error.manager";

@ApiTags('pdm')
@Controller('pdm')
export class PdmController {
      
    constructor(
        private readonly pdmService: PdmService,
        private readonly pdmModel: PdmModel,
        private readonly itemsModel: ItemsModel
    ) { }
    

    @Get('list')
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async list() {

        try {    
                        
            const res = await this.pdmModel.list();

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
            
            await this.pdmModel.verifyCodeExists(dto.code);                                                           
            await this.pdmModel.savePdm(dto);
            
            return {type: "success"}

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

            await this.pdmModel.deleteById(_id);                                        
           
            return { type: "success" }           

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

            await this.pdmModel.updatePdm(id, dto);            
            await this.itemsModel.updateItemByUpdatedPdm(id, dto.name, dto.propertyList);

            return { type: "success" }

        } catch (error) {
            throw ErrorManager.createError(error)
        }
    }

    @Get("get-by-id/:_id")
    @HttpCode(200)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getById(@Param("_id") _id: string) {        
        try {
            return await this.pdmModel.getById(_id);
        } catch (error) {
            throw ErrorManager.createError(error)   
        }
    }

}

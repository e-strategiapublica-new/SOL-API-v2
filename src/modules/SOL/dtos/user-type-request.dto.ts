import { ApiProperty } from "@nestjs/swagger";
import { UserTypeEnum } from "../enums/user-type.enum";
import { UserRolesEnum } from "../enums/user-roles.enum";

export abstract class UserTypeRequestDto {

    @ApiProperty({ type: String, enum: UserRolesEnum })
    roles: UserRolesEnum;

    
}
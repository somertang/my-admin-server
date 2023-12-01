import {ALL, Body, Controller, Del, Get, Inject, Param, Post, Put, Query} from "@midwayjs/core";
import {UserService} from "../service/user.service";
import {UserDto} from "../dto/user.dto";
import {PageDTO} from "@/common/page.dto";

@Controller('/user')
export class UserController{

  @Inject()
  userService:UserService;

  @Post('/create')
  async createUser(@Body(ALL) user: UserDto){
    return await this.userService.createUser(user.toEntity());;
  }

  @Get('/page')
  async page(@Query() pageParam: PageDTO){
    // const user = new UserEntity();
    // user.userName = userParam.userName;
    // user.userPassword = userParam.userPassword;
    // user.userMobile = userParam.userMobile;
    // user.userEmail = userParam.userEmail;
    // user.userDesc = userParam.userDesc;
    const result = await this.userService.page(pageParam.page, pageParam.size);
    return result;
  }

  @Put('/update')
  async updateUser(@Body(ALL) userParam: UserDto){
    console.log(userParam.toEntity(), 'ss');
    return await this.userService.editUser(userParam.toEntity());
  }

  @Del('/delete/:id')
  async deleteUser(@Param('id') id:string){
    const user = await this.userService.getById(id);
    return await this.userService.remove(user);
  }

  @Get('/list')
  async list(@Query() userParam: UserDto){
    return await this.userService.list(userParam);
  }

}

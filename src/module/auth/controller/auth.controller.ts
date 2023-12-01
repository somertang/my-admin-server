import {
  Controller,
  Get,
  Inject,
  Provide,
} from '@midwayjs/decorator';
import { AuthService } from '../service/auth.service';
import {CaptchaService} from "@/module/auth/service/captcha.service";
import {RedisService} from "@midwayjs/redis";
import {ALL, Body, Post} from "@midwayjs/core";
import {LoginDTO} from "@/module/auth/dto/login.dto";
import {ApiResponse} from "@midwayjs/swagger";
import {TokenVo} from "@/module/auth/vo/token.vo";
import {R} from "@/common/base.error";
import * as NodeRS from 'node-rsa';

@Provide()
@Controller('/auth')
export class AuthController {
  @Inject()
  authService: AuthService;

  @Inject()
  captchaService: CaptchaService;

  @Inject()
  redisService: RedisService;

  @Get('/captcha')
  async getImageCaptcha() {
    const {id, imageBase64} = await this.captchaService.formula({
      height: 40,
      width: 120,
      noise: 1,
      color: true,
    });
    return {id, imageBase64};
  }

  @Post('/login', { description: '登录' })
  @ApiResponse({ type: TokenVo })
  async login(@Body(ALL) loginDto: LoginDTO){
    const { captcha, captchaId } = loginDto;

    const result = await this.captchaService.check(captchaId, captcha);

    if(!result){
      throw R.error('验证码错误');
    }

    return await this.authService.login(loginDto);
  }

  @Get('/public-key', { description: '获取公钥' })
  async getPublicKey(){
    const key = new NodeRS({ b: 512 });
    const publicKey = key.exportKey('public');
    const privateKey = key.exportKey('private');
    this.redisService.set(`publicKey:${publicKey}`, privateKey);
    return publicKey;
  }

}

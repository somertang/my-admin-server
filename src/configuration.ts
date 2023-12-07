import { Configuration, App, Inject } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as info from '@midwayjs/info';
import * as orm from '@midwayjs/typeorm';
import * as swagger from '@midwayjs/swagger';
import * as redis from '@midwayjs/redis';
import * as casbin from '@midwayjs/casbin';
import * as i18n from '@midwayjs/i18n';
import * as captcha from '@midwayjs/captcha';
import * as cache from '@midwayjs/cache';
import * as upload from '@midwayjs/upload';
import * as bull from '@midwayjs/bull';
import { join } from 'path';
import { DefaultErrorFilter } from './filter/default.filter';
import { NotFoundFilter } from './filter/notfound.filter';
import { ValidateErrorFilter } from './filter/validate.filter';
import { CommonErrorFilter } from './filter/common.filter';
import { ReportMiddleware } from './middleware/report.middleware';
import { AuthMiddleware } from '@/middleware/auth.middleware';
import { UnauthorizedFilter } from '@/filter/unauthorized.filter';

@Configuration({
  imports: [
    koa,
    validate,
    orm,
    redis,
    casbin,
    i18n,
    captcha,
    cache,
    upload,
    bull,
    {
      component: info,
      enabledEnvironment: ['local'],
    },
    {
      component: swagger,
      enabledEnvironment: ['local'],
    },
  ],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Inject()
  bullFramework: bull.Framework;

  async onReady() {
    // add middleware
    this.app.useMiddleware([ReportMiddleware, AuthMiddleware]);
    // add filter
    this.app.useFilter([
      ValidateErrorFilter,
      CommonErrorFilter,
      UnauthorizedFilter,
      DefaultErrorFilter,
      NotFoundFilter,
    ]);
  }

  async onServerReady() {
    // 获取 Processor 相关的队列
    const clearQueue = this.bullFramework.getQueue('clear_file');
    // 立即执行这个任务
    await clearQueue.runJob(null);
  }
}

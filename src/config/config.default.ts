import { MidwayAppInfo } from '@midwayjs/core';
import { CasbinRule, createAdapter } from '@midwayjs/casbin-typeorm-adapter';
import { createWatcher } from '@midwayjs/casbin-redis-adapter';
import * as redisStore from 'cache-manager-ioredis';
import { env } from 'process';
import { EverythingSubscriber } from '../typeorm-event-subscriber';
import { join } from 'path';
import { TokenConfig } from '@/interface/token.config';

export default (appInfo: MidwayAppInfo) => ({
  // use for cookie sign key, should change to your own and keep security
  keys: '1700975928749_530',
  koa: {
    port: 7001,
    globalPrefix: '/api',
  },
  typeorm: {
    dataSource: {
      default: {
        /**
         * 单数据库实例
         */
        type: 'mysql',
        host: 'localhost', // 数据库ip地址，本地就写localhost
        port: 3306,
        username: 'root',
        password: '123456',
        database: 'my_admin', // 数据库名称
        synchronize: true, // 如果第一次使用，不存在表，有同步的需求可以写 true，注意会丢数据
        logging: true,
        // 扫描entity文件夹
        entities: ['**/entity/*{.ts,.js}', CasbinRule],
        timezone: '+08:00',
        migrations: ['**/migration/*.ts', CasbinRule],
        cli: {
          migrationsDir: 'migration',
        },
        subscribers: [EverythingSubscriber],
      },
    },
  },
  redis: {
    clients: {
      default: {
        port: 6379, // Redis port
        host: env.REDIS_HOST || 'localhost', // Redis host
        password: env.REDIS_PASSWORD || '',
        db: 0,
      },
      publish: {
        port: 6379, // Redis port
        host: env.REDIS_HOST || 'localhost', // Redis host
        password: env.REDIS_PASSWORD || '',
        db: 1,
      },
      subscribe: {
        port: 6379, // Redis port
        host: env.REDIS_HOST || 'localhost', // Redis host
        password: env.REDIS_PASSWORD || '',
        db: 2,
      },
      'node-casbin-official': {
        port: 6379, // Redis port
        host: env.REDIS_HOST || 'localhost', // Redis host
        password: env.REDIS_PASSWORD || '',
        db: 3,
      },
      'node-casbin-sub': {
        port: 6379, // Redis port
        host: env.REDIS_HOST || 'localhost', // Redis host
        password: env.REDIS_PASSWORD || '',
        db: 3,
      },
    },
  },
  i18n: {
    // 把你的翻译文本放到这里
    localeTable: {
      en_US: require('../locales/en_US'),
      zh_CN: require('../locales/zh_CN'),
    },
  },
  validate: {
    validationOptions: {
      allowUnknown: true, // 全局生效
    },
  },
  token: {
    expire: 60 * 60 * 2, // 2小时
    refreshExpire: 60 * 60 * 24 * 7, // 7天
  } as TokenConfig,
  cache: {
    store: redisStore,
    options: {
      host: env.REDIS_HOST || 'localhost', // default value
      port: 6379, // default value
      password: env.REDIS_PASSWORD || 'redis123456',
      db: 0,
      keyPrefix: 'cache:',
      ttl: 100,
    },
  },
  casbin: {
    modelPath: join(appInfo.baseDir, 'basic_model.conf'),
    policyAdapter: createAdapter({
      dataSourceName: 'default',
    }),
    policyWatcher: createWatcher({
      pubClientName: 'node-casbin-official',
      subClientName: 'node-casbin-sub',
    }),
  },
});

import {
  ApplicationContext,
  Autoload,
  Config,
  IMidwayContainer,
  Init,
  Singleton,
} from '@midwayjs/core';
import * as Minio from 'minio';
import { MinioConfig } from '@/interface';

export type MinioClient = Minio.Client;

@Autoload()
@Singleton()
export class MinioAutoload {
  @ApplicationContext()
  applicationContext: IMidwayContainer;

  @Config('minio')
  minioConfig: MinioConfig;

  @Init()
  async init() {
    const minioClient = new Minio.Client(this.minioConfig);
    this.applicationContext.registerObject('minioClient', minioClient);
  }
}
